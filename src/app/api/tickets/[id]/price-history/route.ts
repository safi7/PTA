import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const PRICE_FIELDS = ['original_price', 'sold_price', 'paid_amount', 'due_amount', 'commission'];

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, created_at, old_values, new_values, changed_by:users!user_id(username, full_name)')
    .eq('entity_type', 'ticket')
    .eq('entity_id', id)
    .eq('action', 'UPDATE')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 });

  const history = (data ?? [])
    .map((log) => {
      const old = (log.old_values ?? {}) as Record<string, unknown>;
      const next = (log.new_values ?? {}) as Record<string, unknown>;
      const changes = PRICE_FIELDS
        .filter((f) => Number(old[f] ?? 0) !== Number(next[f] ?? 0))
        .map((f) => ({ field: f, old: Number(old[f] ?? 0), new: Number(next[f] ?? 0) }));
      if (changes.length === 0) return null;
      return { id: log.id, changed_at: log.created_at, changed_by: log.changed_by, changes };
    })
    .filter(Boolean);

  return NextResponse.json({ data: history });
}
