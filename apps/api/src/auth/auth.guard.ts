import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { FindUserByIdQuery } from '../users/index.js';
import type { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
}

export type AuthenticatedRequest = Request & { user: AuthUser };

// Имя httpOnly-cookie, в которую веб-приложение кладёт JWT после входа.
export const ACCESS_TOKEN_COOKIE = 'accessToken';

function extractToken(req: Request): string | null {
  // Схема авторизации регистронезависима (RFC 7235).
  const bearer = /^Bearer +(\S+)$/i.exec(req.headers.authorization ?? '');
  if (bearer) return bearer[1];
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === ACCESS_TOKEN_COOKIE && value.length) return value.join('=');
  }
  return null;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(QueryBus) private readonly queryBus: QueryBus,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractToken(req);
    if (!token) throw new UnauthorizedException();

    let payload: { sub: string; email: string };
    try {
      payload = await this.jwt.verifyAsync(token, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException();
    }
    // Токен удалённого пользователя больше не действителен.
    const user = await this.queryBus.execute(
      new FindUserByIdQuery(payload.sub),
    );
    if (!user) throw new UnauthorizedException();
    req.user = { id: user.id, email: user.email };
    return true;
  }
}
