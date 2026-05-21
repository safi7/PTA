import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/helpers/audit';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  if (userId) {
    await logAudit({
      userId,
      action: 'LOGOUT',
      entityType: 'session',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });
  }

  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.delete('pta_token');
  return res;
}
