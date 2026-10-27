import { Query } from '@nestjs/cqrs';
import type { User } from '../user.js';

export class FindUserByIdQuery extends Query<User | null> {
  constructor(public readonly id: string) {
    super();
  }
}
