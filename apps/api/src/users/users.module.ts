import { Module } from '@nestjs/common';
import { CreateUserHandler } from './commands/create-user.handler.js';
import { FindUserByEmailHandler } from './queries/find-user-by-email.handler.js';
import { FindUserByIdHandler } from './queries/find-user-by-id.handler.js';
import { UsersRepository } from './users.repository.js';

// Снаружи модуль доступен только через CommandBus/QueryBus (см. index.ts).
@Module({
  providers: [
    UsersRepository,
    CreateUserHandler,
    FindUserByEmailHandler,
    FindUserByIdHandler,
  ],
})
export class UsersModule {}
