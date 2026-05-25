import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPeriodDates, percentChange } from '@/lib/helpers';
import dayjs from 'dayjs';

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const period = searchParams.get('period') ?? 'today';

  let startDate: string, endDate: string, prevStartDate: string, prevEndDate: string;

  if (period === 'custom') {
    const rawStart = searchParams.get('startDate');
    const rawEnd = searchParams.get('endDate');
    startDate = rawStart ? dayjs(rawStart).startOf('day').toISOString() : dayjs().startOf('day').toISOString();
    endDate = rawEnd ? dayjs(rawEnd).endOf('day').toISOString() : dayjs().endOf('day').toISOString();
    const rangeMs = dayjs(endDate).diff(dayjs(startDate));
    prevEndDate = dayjs(startDate).toISOString();
    prevStartDate = dayjs(startDate).subtract(rangeMs, 'ms').toISOString();
  } else {
    ({ startDate, endDate, prevStartDate, prevEndDate } = getPeriodDates(period));
  }

  const supabase = createServerClient();

  const [curr, prev] = await Promise.all([
    supabase.from('tickets').select('sold_price, commission, due_amount').gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('tickets').select('sold_price, commission, due_amount').gte('created_at', prevStartDate).lte('created_at', prevEndDate),
  ]);

  const sum = (arr: { sold_price: number; commission: number; due_amount: number }[]) => ({
    totalRevenue: arr.reduce((s, t) => s + (t.sold_price ?? 0), 0),
    totalTickets: arr.length,
    totalCommission: arr.reduce((s, t) => s + (t.commission ?? 0), 0),
    totalDue: arr.reduce((s, t) => s + (t.due_amount ?? 0), 0),
  });

  const c = sum(curr.data ?? []);
  const p = sum(prev.data ?? []);

  return NextResponse.json({
    data: {
      ...c,
      revenueChange: percentChange(c.totalRevenue, p.totalRevenue),
      ticketsChange: percentChange(c.totalTickets, p.totalTickets),
      commissionChange: percentChange(c.totalCommission, p.totalCommission),
      period, startDate, endDate,
    },
  });
}
