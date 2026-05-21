import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createServerClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/helpers/audit';

const updateSchema = z.object({
  email: z.string().email().max(200).optional(),
  full_name: z.string().min(1).max(200).optional(),
  password: z.string().min(8).max(200).optional(),
  role: z.enum(['admin', 'super_admin']).optional(),
  is_active: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (request.headers.get('x-user-role') !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = request.headers.get('x-user-id')!;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { password, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
  if (password) updates.password_hash = await bcrypt.hash(password, 12);

  const supabase = createServerClient();
  const { data: existing } = await supabase.from('users').select().eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { data: user, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, username, email, full_name, role, is_active, updated_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });

  await logAudit({
    userId, action: 'UPDATE', entityType: 'user', entityId: id,
    oldValues: { role: existing.role, is_active: existing.is_active },
    newValues: { role: user.role, is_active: user.is_active },
    ipAddress: ip, userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ data: user });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (request.headers.get('x-user-role') !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = request.headers.get('x-user-id')!;
  if (id === userId) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const supabase = createServerClient();

  const { data: existing } = await supabase.from('users').select().eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });

  await logAudit({
    userId, action: 'DELETE', entityType: 'user', entityId: id,
    oldValues: { username: existing.username, email: existing.email },
    ipAddress: ip, userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ message: 'User deleted' });
}
