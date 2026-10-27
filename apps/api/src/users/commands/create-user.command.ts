import { Command } from '@nestjs/cqrs';
import type { User } from '../user.js';

/** Результат — null, если пользователь с таким e-mail уже существует. */
export class CreateUserCommand extends Command<User | null> {
  constructor(
    public readonly email: string,
    public readonly passwordHash: string,
  ) {
    super();
  }
}
