import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const HEADERS = [
  'Ticket Number', 'Client Name', 'Client Phone', 'Client Email', 'Client Address',
  'From', 'To', 'Departure Date', 'Return Date', 'Airline',
  'Original Price', 'Sold Price', 'Paid Amount', 'Due Amount', 'Commission',
  'Status', 'Notes', 'Booked By', 'Created At',
];

export async function GET() {
  const supabase = createServerClient();

  const yearStart = `${new Date().getFullYear()}-01-01`;

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*, creator:users!created_by(full_name, username)')
    .gte('created_at', yearStart)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 });

  const rows = (tickets ?? []).map((t) => [
    t.ticket_number,
    t.client_name,
    t.client_phone,
    t.client_email,
    t.client_address,
    t.from_location,
    t.to_location,
    t.departure_date,
    t.return_date,
    t.airline,
    t.original_price,
    t.sold_price,
    t.paid_amount,
    t.due_amount,
    t.commission,
    t.status,
    t.notes,
    t.creator ? (t.creator.full_name || t.creator.username) : '',
    t.created_at,
  ].map(escapeCSV).join(','));

  const csv = [HEADERS.join(','), ...rows].join('\r\n');

  // Update last_backup_at globally
  await supabase
    .from('system_settings')
    .update({ value: new Date().toISOString() })
    .eq('key', 'last_backup_at');

  const filename = `pta-backup-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
