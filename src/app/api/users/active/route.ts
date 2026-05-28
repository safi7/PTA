import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, username, full_name')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
