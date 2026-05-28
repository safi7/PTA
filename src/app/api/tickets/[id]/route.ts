import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { calculateDueAmount, calculateCommission } from '@/lib/helpers';
import { logAudit } from '@/lib/helpers/audit';

const updateSchema = z.object({
  client_name: z.string().min(1).max(200).optional(),
  client_phone: z.string().max(50).nullable().optional(),
  client_email: z.string().email().max(200).nullable().optional(),
  client_address: z.string().max(500).nullable().optional(),
  from_location: z.string().min(1).max(200).optional(),
  to_location: z.string().min(1).max(200).optional(),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  airline: z.string().max(200).nullable().optional(),
  original_price: z.number().min(0).optional(),
  sold_price: z.number().min(0).optional(),
  paid_amount: z.number().min(0).optional(),
  status: z.enum(['pending', 'paid', 'cancelled']).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('*, creator:users!created_by(id, username, full_name)')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = request.headers.get('x-user-id')!;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const supabase = createServerClient();

  const { data: existing, error: fetchErr } = await supabase.from('tickets').select().eq('id', id).single();
  if (fetchErr || !existing) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const updates = parsed.data;
  const sold_price = updates.sold_price ?? existing.sold_price;
  const original_price = updates.original_price ?? existing.original_price;
  const paid_amount = updates.paid_amount ?? existing.paid_amount;

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update({
      ...updates,
      due_amount: calculateDueAmount(sold_price, paid_amount),
      commission: calculateCommission(sold_price, original_price),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });

  await logAudit({
    userId, action: 'UPDATE', entityType: 'ticket', entityId: id,
    oldValues: existing, newValues: ticket,
    ipAddress: ip, userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ data: ticket });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = request.headers.get('x-user-id')!;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const supabase = createServerClient();

  const { data: existing, error: fetchErr } = await supabase.from('tickets').select().eq('id', id).single();
  if (fetchErr || !existing) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });

  await logAudit({
    userId, action: 'DELETE', entityType: 'ticket', entityId: id,
    oldValues: existing, ipAddress: ip, userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ message: 'Ticket deleted' });
}
