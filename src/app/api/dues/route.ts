import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

type SortBy = 'date' | 'amount';
type SortDir = 'asc' | 'desc';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20')));
  const sortBy: SortBy = searchParams.get('sortBy') === 'amount' ? 'amount' : 'date';
  const sortDir: SortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

  const supabase = createServerClient();
  const column = sortBy === 'amount' ? 'due_amount' : 'created_at';

  const start = (page - 1) * pageSize;

  const [{ data, error, count }, { data: sumData }] = await Promise.all([
    supabase
      .from('tickets')
      .select('*, creator:users!created_by(id, username, full_name)', { count: 'exact' })
      .gt('due_amount', 0)
      .order(column, { ascending: sortDir === 'asc' })
      .range(start, start + pageSize - 1),
    supabase
      .from('tickets')
      .select('due_amount')
      .gt('due_amount', 0),
  ]);

  if (error) return NextResponse.json({ error: 'Failed to fetch outstanding dues' }, { status: 500 });

  const totalDue = (sumData ?? []).reduce((sum, t) => sum + Number(t.due_amount), 0);

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    totalDue,
    page,
    pageSize,
  });
}
