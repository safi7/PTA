import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';

  const supabase = createServerClient();
  let query = supabase
    .from('tickets')
    .select(
      'ticket_number, client_name, client_phone, client_email, from_location, to_location, ' +
      'departure_date, return_date, airline, original_price, sold_price, paid_amount, ' +
      'due_amount, commission, status, notes, created_at'
    )
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(
      `client_name.ilike.%${search}%,ticket_number.ilike.%${search}%,` +
      `from_location.ilike.%${search}%,to_location.ilike.%${search}%`
    );
  }
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to export tickets' }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}
