import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPeriodDates } from '@/lib/helpers';
import dayjs from 'dayjs';

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const period = searchParams.get('period') ?? 'today';

  let startDate: string, endDate: string;
  let groupBy: 'hour' | 'day' | 'month';

  if (period === 'custom') {
    const rawStart = searchParams.get('startDate');
    const rawEnd = searchParams.get('endDate');
    startDate = rawStart ?? dayjs().startOf('day').toISOString();
    endDate = rawEnd ?? dayjs().endOf('day').toISOString();
    const daysDiff = dayjs(endDate).diff(dayjs(startDate), 'day');
    groupBy = daysDiff <= 1 ? 'hour' : daysDiff <= 90 ? 'day' : 'month';
  } else {
    ({ startDate, endDate } = getPeriodDates(period));
    groupBy =
      period === 'today' || period === 'yesterday' ? 'hour' :
      period === 'this_year' ? 'month' : 'day';
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('created_at, sold_price, commission')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at');

  if (error) return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });

  const grouped = new Map<string, { revenue: number; tickets: number; commission: number }>();

  for (const ticket of data ?? []) {
    const dt = dayjs(ticket.created_at);
    const key =
      groupBy === 'hour' ? dt.format('HH:00') :
      groupBy === 'month' ? dt.format('MMM') :
      dt.format('MMM DD');

    const prev = grouped.get(key) ?? { revenue: 0, tickets: 0, commission: 0 };
    grouped.set(key, {
      revenue: prev.revenue + (ticket.sold_price ?? 0),
      tickets: prev.tickets + 1,
      commission: prev.commission + (ticket.commission ?? 0),
    });
  }

  const chartData = Array.from(grouped.entries()).map(([date, vals]) => ({ date, ...vals }));
  return NextResponse.json({ data: chartData });
}
