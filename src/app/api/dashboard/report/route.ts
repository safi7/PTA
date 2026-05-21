import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import dayjs from 'dayjs';

export async function GET(request: NextRequest) {
  const year = parseInt(new URL(request.url).searchParams.get('year') ?? String(dayjs().year()));
  const supabase = createServerClient();

  const startDate = dayjs().year(year).startOf('year').toISOString();
  const endDate = dayjs().year(year).endOf('year').toISOString();

  const [ticketsRes, earliestRes] = await Promise.all([
    supabase
      .from('tickets')
      .select('created_at, sold_price, original_price, commission, due_amount, paid_amount')
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabase.from('tickets').select('created_at').order('created_at', { ascending: true }).limit(1),
  ]);

  if (ticketsRes.error) return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });

  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: dayjs().month(i).format('MMMM'),
    monthNum: i + 1,
    revenue: 0, originalCost: 0, commission: 0, paid: 0, due: 0, tickets: 0,
  }));

  for (const t of ticketsRes.data ?? []) {
    const idx = dayjs(t.created_at).month();
    monthly[idx].revenue += t.sold_price ?? 0;
    monthly[idx].originalCost += t.original_price ?? 0;
    monthly[idx].commission += t.commission ?? 0;
    monthly[idx].paid += t.paid_amount ?? 0;
    monthly[idx].due += t.due_amount ?? 0;
    monthly[idx].tickets += 1;
  }

  const earliestYear = earliestRes.data?.[0]
    ? dayjs(earliestRes.data[0].created_at).year()
    : dayjs().year();

  const currentYear = dayjs().year();
  const availableYears = Array.from(
    { length: currentYear - earliestYear + 1 },
    (_, i) => currentYear - i
  );

  return NextResponse.json({ data: { monthly, year, availableYears } });
}
