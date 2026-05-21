import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { calculateDueAmount, calculateCommission } from '@/lib/helpers';
import { logAudit } from '@/lib/helpers/audit';

const createSchema = z.object({
  client_name: z.string().min(1).max(200),
  client_phone: z.string().max(50).nullable().optional(),
  client_email: z.string().email().max(200).nullable().optional(),
  from_location: z.string().min(1).max(200),
  to_location: z.string().min(1).max(200),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  airline: z.string().max(200).nullable().optional(),
  original_price: z.number().min(0),
  sold_price: z.number().min(0),
  paid_amount: z.number().min(0),
  status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  notes: z.string().max(2000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20')));
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  const supabase = createServerClient();
  let query = supabase
    .from('tickets')
    .select('*, creator:users!created_by(id, username, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) query = query.or(`client_name.ilike.%${search}%,ticket_number.ilike.%${search}%,from_location.ilike.%${search}%,to_location.ilike.%${search}%`);
  if (status) query = query.eq('status', status);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const start = (page - 1) * pageSize;
  query = query.range(start, start + pageSize - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });

  return NextResponse.json({ data, total: count ?? 0, page, pageSize });
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')!;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const data = parsed.data;
  const ticket_number = `PTA-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  const supabase = createServerClient();
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      ...data,
      ticket_number,
      due_amount: calculateDueAmount(data.sold_price, data.paid_amount),
      commission: calculateCommission(data.sold_price, data.original_price),
      created_by: userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });

  await logAudit({
    userId, action: 'CREATE', entityType: 'ticket', entityId: ticket.id,
    newValues: ticket, ipAddress: ip, userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ data: ticket }, { status: 201 });
}
