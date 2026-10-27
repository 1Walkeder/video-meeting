import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../users.repository.js';
import type { User } from '../user.js';
import { FindUserByEmailQuery } from './find-user-by-email.query.js';

@QueryHandler(FindUserByEmailQuery)
export class FindUserByEmailHandler implements IQueryHandler<FindUserByEmailQuery> {
  constructor(
    @Inject(UsersRepository) private readonly users: UsersRepository,
  ) {}

  execute({ email }: FindUserByEmailQuery): Promise<User | null> {
    return this.users.findByEmail(email);
  }
}
