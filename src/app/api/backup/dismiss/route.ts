import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')!;
  const supabase = createServerClient();

  const { error } = await supabase
    .from('users')
    .update({ backup_dismissed_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return NextResponse.json({ error: 'Failed to dismiss' }, { status: 500 });

  return NextResponse.json({ data: { ok: true } });
}
