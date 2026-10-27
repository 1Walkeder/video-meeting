import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../users.repository.js';
import type { User } from '../user.js';
import { CreateUserCommand } from './create-user.command.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(UsersRepository) private readonly users: UsersRepository,
  ) {}

  execute({ email, passwordHash }: CreateUserCommand): Promise<User | null> {
    return this.users.create(email, passwordHash);
  }
}
