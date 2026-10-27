import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module.js';
import { CreateMeetingDto } from './meetings.dto.js';

export interface Meeting {
  id: string;
  title: string;
  date: Date;
  participants: string[];
}

const COLUMNS = 'id, title, date, participants';

@Injectable()
export class MeetingsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async create(ownerId: string, dto: CreateMeetingDto): Promise<Meeting> {
    const { rows } = await this.pool.query(
      `INSERT INTO meetings (owner_id, title, date, participants)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [ownerId, dto.title, dto.date, dto.participants],
    );
    return rows[0];
  }

  async findAllByOwner(ownerId: string): Promise<Meeting[]> {
    const { rows } = await this.pool.query(
      `SELECT ${COLUMNS} FROM meetings WHERE owner_id = $1 ORDER BY created_at, id`,
      [ownerId],
    );
    return rows;
  }

  async findRecentByOwner(ownerId: string, limit = 3): Promise<Meeting[]> {
    const { rows } = await this.pool.query(
      `SELECT ${COLUMNS} FROM meetings WHERE owner_id = $1
       ORDER BY created_at DESC, id DESC LIMIT $2`,
      [ownerId, limit],
    );
    return rows;
  }

  async findOneByOwner(ownerId: string, id: string): Promise<Meeting | null> {
    const { rows } = await this.pool.query(
      `SELECT ${COLUMNS} FROM meetings WHERE id = $1 AND owner_id = $2`,
      [id, ownerId],
    );
    return rows[0] ?? null;
  }
}
