import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')!;
  const supabase = createServerClient();

  const [{ data: setting }, { data: user }] = await Promise.all([
    supabase.from('system_settings').select('value').eq('key', 'last_backup_at').single(),
    supabase.from('users').select('backup_dismissed_at').eq('id', userId).single(),
  ]);

  const lastBackupAt: string | null = setting?.value ?? null;
  const dismissedAt: string | null = user?.backup_dismissed_at ?? null;

  const backupDue =
    !lastBackupAt ||
    new Date(lastBackupAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const notDismissedToday = !dismissedAt || new Date(dismissedAt) < todayStart;

  return NextResponse.json({
    data: {
      should_show: backupDue && notDismissedToday,
      last_backup_at: lastBackupAt,
    },
  });
}
