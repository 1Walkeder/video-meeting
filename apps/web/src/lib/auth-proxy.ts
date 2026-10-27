import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

// Совпадает с ACCESS_TOKEN_COOKIE в apps/api/src/auth/auth.guard.ts.
const COOKIE = 'accessToken';
// Совпадает со сроком жизни JWT на бэкенде (1 час).
const MAX_AGE = 60 * 60;

/**
 * Проксирует register/login на бэкенд, а полученный JWT кладёт в httpOnly-cookie
 * вместо ответа — так токен недоступен JS-коду страницы (защита от кражи через XSS).
 */
export async function proxyAuth(path: string, req: Request) {
  const body = await req.text();
  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch {
    return Response.json({ message: 'Сервер недоступен' }, { status: 502 });
  }

  const data = await upstream.json().catch(() => null);
  if (!upstream.ok || typeof data?.accessToken !== 'string') {
    return Response.json(data, { status: upstream.status });
  }

  (await cookies()).set(COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
  return Response.json({ ok: true }, { status: upstream.status });
}

export async function clearAuthCookie() {
  (await cookies()).delete(COOKIE);
}
