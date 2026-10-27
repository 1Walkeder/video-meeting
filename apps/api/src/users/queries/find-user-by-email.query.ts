import { Query } from '@nestjs/cqrs';
import type { User } from '../user.js';

export class FindUserByEmailQuery extends Query<User | null> {
  constructor(public readonly email: string) {
    super();
  }
}
