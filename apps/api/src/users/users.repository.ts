import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module.js';
import type { User } from './user.js';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      'SELECT id, email, password_hash AS "passwordHash" FROM users WHERE lower(email) = lower($1)',
      [email],
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      'SELECT id, email, password_hash AS "passwordHash" FROM users WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  }

  /** Возвращает null, если пользователь с таким e-mail уже существует. */
  async create(email: string, passwordHash: string): Promise<User | null> {
    try {
      const { rows } = await this.pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, password_hash AS "passwordHash"',
        [email.toLowerCase(), passwordHash],
      );
      return rows[0];
    } catch (err) {
      if ((err as { code?: string }).code === PG_UNIQUE_VIOLATION) return null;
      throw err;
    }
  }
}
