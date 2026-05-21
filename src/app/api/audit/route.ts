import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  if (request.headers.get('x-user-role') !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20'));
  const action = searchParams.get('action') ?? '';

  const supabase = createServerClient();
  let query = supabase
    .from('audit_logs')
    .select('*, user:users!user_id(id, username, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (action) query = query.eq('action', action);

  const start = (page - 1) * pageSize;
  query = query.range(start, start + pageSize - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });

  return NextResponse.json({ data, total: count ?? 0, page, pageSize });
}
