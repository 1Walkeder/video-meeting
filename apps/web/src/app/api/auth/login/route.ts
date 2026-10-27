import { proxyAuth } from '@/lib/auth-proxy';

export function POST(req: Request) {
  return proxyAuth('/auth/login', req);
}
