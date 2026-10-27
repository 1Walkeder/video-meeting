import { proxyAuth } from '@/lib/auth-proxy';

export function POST(req: Request) {
  return proxyAuth('/auth/register', req);
}
