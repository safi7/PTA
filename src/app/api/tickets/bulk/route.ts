import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { calculateDueAmount, calculateCommission } from '@/lib/helpers';
import { logAudit } from '@/lib/helpers/audit';

const rowSchema = z.object({
  client_name: z.string().min(1).max(200),
  client_phone: z.string().max(50).optional().nullable(),
  client_email: z.string().email().max(200).optional().nullable(),
  from_location: z.string().min(1).max(200),
  to_location: z.string().min(1).max(200),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'departure_date must be YYYY-MM-DD'),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  airline: z.string().max(200).optional().nullable(),
  original_price: z.coerce.number().min(0),
  sold_price: z.coerce.number().min(0),
  paid_amount: z.coerce.number().min(0),
  status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')!;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? undefined;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tickets } = body as { tickets: unknown[] };
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return NextResponse.json({ error: 'No tickets provided' }, { status: 400 });
  }
  if (tickets.length > 500) {
    return NextResponse.json({ error: 'Maximum 500 tickets per import' }, { status: 400 });
  }

  const supabase = createServerClient();
  const results = { created: 0, errors: [] as { row: number; message: string }[] };

  for (let i = 0; i < tickets.length; i++) {
    const parsed = rowSchema.safeParse(tickets[i]);
    if (!parsed.success) {
      results.errors.push({ row: i + 1, message: parsed.error.errors[0].message });
      continue;
    }
    const d = parsed.data;
    const ticket_number = `PTA-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        ...d,
        ticket_number,
        due_amount: calculateDueAmount(d.sold_price, d.paid_amount),
        commission: calculateCommission(d.sold_price, d.original_price),
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      results.errors.push({ row: i + 1, message: 'Database error — check for duplicate or invalid data' });
    } else {
      results.created++;
      await logAudit({ userId, action: 'CREATE', entityType: 'ticket', entityId: ticket.id, newValues: ticket, ipAddress: ip, userAgent });
    }
  }

  return NextResponse.json(results, { status: results.created > 0 ? 201 : 422 });
}
