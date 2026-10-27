import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { CreateUserCommand, FindUserByEmailQuery } from '../users/index.js';
import { hashPassword, verifyPassword } from './password.js';

// Хеш-заглушка: для неизвестного e-mail тоже выполняем scrypt, чтобы время
// ответа не выдавало, зарегистрирован ли адрес.
const DUMMY_HASH = await hashPassword('dummy-password');

export interface AuthResult {
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(CommandBus) private readonly commandBus: CommandBus,
    @Inject(QueryBus) private readonly queryBus: QueryBus,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string): Promise<AuthResult> {
    const user = await this.commandBus.execute(
      new CreateUserCommand(email, await hashPassword(password)),
    );
    if (!user) throw new ConflictException('User already exists');
    return this.issueToken(user.id, user.email);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.queryBus.execute(new FindUserByEmailQuery(email));
    const valid = await verifyPassword(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    // Одинаковая ошибка для неизвестного e-mail и неверного пароля.
    if (!user || !valid) throw new UnauthorizedException('Invalid credentials');
    return this.issueToken(user.id, user.email);
  }

  private async issueToken(sub: string, email: string): Promise<AuthResult> {
    return { accessToken: await this.jwt.signAsync({ sub, email }) };
  }
}
