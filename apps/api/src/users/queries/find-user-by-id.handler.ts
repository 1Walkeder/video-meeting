import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../users.repository.js';
import type { User } from '../user.js';
import { FindUserByIdQuery } from './find-user-by-id.query.js';

@QueryHandler(FindUserByIdQuery)
export class FindUserByIdHandler implements IQueryHandler<FindUserByIdQuery> {
  constructor(
    @Inject(UsersRepository) private readonly users: UsersRepository,
  ) {}

  execute({ id }: FindUserByIdQuery): Promise<User | null> {
    return this.users.findById(id);
  }
}
