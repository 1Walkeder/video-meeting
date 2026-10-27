import {
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

@Injectable()
class DatabaseLifecycle implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit() {
    // Временная замена миграциям, пока их нет в проекте.
    // Advisory lock защищает от гонки при параллельном старте нескольких приложений.
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(42)');
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await client.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email))',
      );
      await client.query(`
        CREATE TABLE IF NOT EXISTS meetings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_id UUID NOT NULL REFERENCES users (id),
          title TEXT NOT NULL,
          date TIMESTAMPTZ NOT NULL,
          participants TEXT[] NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await client.query(
        'CREATE INDEX IF NOT EXISTS meetings_owner_id_idx ON meetings (owner_id)',
      );
      await client.query('COMMIT');
    } catch (err) {
      // Сбой ROLLBACK (например, обрыв соединения) не должен скрывать исходную ошибку.
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => {
        const pool = new Pool({
          connectionString:
            process.env.DATABASE_URL ??
            'postgres://postgres:postgres@localhost:5432/video_meetings',
        });
        // Ошибка простаивающего клиента (например, рестарт Postgres) без
        // обработчика уронила бы процесс.
        pool.on('error', (err) =>
          new Logger('Database').error(`Idle client error: ${err.message}`),
        );
        return pool;
      },
    },
    DatabaseLifecycle,
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
