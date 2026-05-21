import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPeriodDates, percentChange } from '@/lib/helpers';

export async function GET(request: NextRequest) {
  const period = new URL(request.url).searchParams.get('period') ?? 'today';
  const { startDate, endDate, prevStartDate, prevEndDate } = getPeriodDates(period);
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
