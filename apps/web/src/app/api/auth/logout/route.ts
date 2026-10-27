import { clearAuthCookie } from '@/lib/auth-proxy';

export async function POST() {
  await clearAuthCookie();
  return Response.json({ ok: true });
}
