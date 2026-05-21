import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, email, full_name, role, is_active, last_login_at, created_at')
    .eq('id', userId)
    .single();

  if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ data: user });
}
