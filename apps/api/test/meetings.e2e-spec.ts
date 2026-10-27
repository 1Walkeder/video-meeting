import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

const PASSWORD = 'Str0ng-Passw0rd!';

// Каждый тест использует уникальных пользователей, поэтому очистка БД между тестами не нужна.
const uniqueEmail = () => `user-${randomUUID()}@example.com`;

const futureDate = (days = 1) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

describe('Meetings (e2e)', () => {
  let app: INestApplication;

  const registerUser = async (): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail(), password: PASSWORD })
      .expect(201);
    return res.body.accessToken;
  };

  const createMeeting = (
    token: string | null,
    body: Record<string, unknown>,
  ) => {
    const req = request(app.getHttpServer()).post('/meetings');
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req.send(body);
  };

  const listMeetings = (token: string | null) => {
    const req = request(app.getHttpServer()).get('/meetings');
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  const getMeeting = (token: string | null, id: string) => {
    const req = request(app.getHttpServer()).get(`/meetings/${id}`);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  const validBody = (overrides: Record<string, unknown> = {}) => ({
    title: `Meeting ${randomUUID()}`,
    date: futureDate(),
    participants: [uniqueEmail(), uniqueEmail()],
    ...overrides,
  });

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-test-secret-at-least-32-characters-long';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('авторизация', () => {
    it('POST /meetings без токена возвращает 401', async () => {
      await createMeeting(null, validBody()).expect(401);
    });

    it('GET /meetings без токена возвращает 401', async () => {
      await listMeetings(null).expect(401);
    });

    it('GET /meetings/:id без токена возвращает 401', async () => {
      await getMeeting(null, randomUUID()).expect(401);
    });

    it('GET /meetings принимает токен из cookie accessToken', async () => {
      const token = await registerUser();
      await request(app.getHttpServer())
        .get('/meetings')
        .set('Cookie', `theme=dark; accessToken=${token}`)
        .expect(200);
    });

    it('невалидный токен в cookie возвращает 401', async () => {
      await request(app.getHttpServer())
        .get('/meetings')
        .set('Cookie', 'accessToken=not.a.token')
        .expect(401);
    });

    it('невалидный токен возвращает 401', async () => {
      await listMeetings('not.a.token').expect(401);
    });
  });

  describe('POST /meetings', () => {
    it('создаёт встречу и возвращает её с id, title, date и participants', async () => {
      const token = await registerUser();
      const body = validBody();

      const res = await createMeeting(token, body).expect(201);

      expect(res.body).toMatchObject({
        id: expect.anything(),
        title: body.title,
        participants: body.participants,
      });
      expect(new Date(res.body.date).toISOString()).toBe(body.date);
    });

    it('создаёт встречу без участников (пустой массив)', async () => {
      const token = await registerUser();

      const res = await createMeeting(
        token,
        validBody({ participants: [] }),
      ).expect(201);

      expect(res.body.participants).toEqual([]);
    });

    it('каждая созданная встреча получает уникальный id', async () => {
      const token = await registerUser();

      const first = await createMeeting(token, validBody()).expect(201);
      const second = await createMeeting(token, validBody()).expect(201);

      expect(first.body.id).not.toBe(second.body.id);
    });

    it('созданная встреча доступна через GET /meetings/:id', async () => {
      const token = await registerUser();
      const body = validBody();

      const created = await createMeeting(token, body).expect(201);
      const res = await getMeeting(token, created.body.id).expect(200);

      expect(res.body).toMatchObject({
        id: created.body.id,
        title: body.title,
        participants: body.participants,
      });
    });

    it('игнорирует лишние поля, например попытку задать id вручную', async () => {
      const token = await registerUser();
      const forcedId = randomUUID();

      const res = await createMeeting(
        token,
        validBody({ id: forcedId, foo: 'bar' }),
      ).expect(201);

      expect(res.body.id).not.toBe(forcedId);
      expect(res.body).not.toHaveProperty('foo');
    });

    it.each([
      ['не передан title', { title: undefined }],
      ['пустой title', { title: '' }],
      ['title не строка', { title: 123 }],
      ['не передана date', { date: undefined }],
      ['невалидная date', { date: 'not-a-date' }],
      ['date не строка', { date: 12345 }],
      ['не переданы participants', { participants: undefined }],
      ['participants не массив', { participants: 'a@example.com' }],
      ['participants содержит не строку', { participants: [123] }],
      ['participants содержит невалидный e-mail', { participants: ['nope'] }],
    ])('возвращает 400: %s', async (_name, overrides) => {
      const token = await registerUser();

      await createMeeting(token, validBody(overrides)).expect(400);
    });

    it('возвращает 400 на пустое тело', async () => {
      const token = await registerUser();

      await createMeeting(token, {}).expect(400);
    });

    it('при невалидных данных встреча не создаётся', async () => {
      const token = await registerUser();

      await createMeeting(token, validBody({ title: '' })).expect(400);

      const res = await listMeetings(token).expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /meetings', () => {
    it('возвращает пустой список, если у пользователя нет встреч', async () => {
      const token = await registerUser();

      const res = await listMeetings(token).expect(200);

      expect(res.body).toEqual([]);
    });

    it('возвращает все встречи текущего пользователя', async () => {
      const token = await registerUser();
      const a = await createMeeting(token, validBody()).expect(201);
      const b = await createMeeting(token, validBody()).expect(201);
      const c = await createMeeting(token, validBody()).expect(201);

      const res = await listMeetings(token).expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body.map((m: { id: string }) => m.id).sort()).toEqual(
        [a.body.id, b.body.id, c.body.id].sort(),
      );
    });

    it('элементы списка содержат id, title, date и participants', async () => {
      const token = await registerUser();
      const body = validBody();
      await createMeeting(token, body).expect(201);

      const res = await listMeetings(token).expect(200);

      expect(res.body[0]).toMatchObject({
        id: expect.anything(),
        title: body.title,
        participants: body.participants,
      });
      expect(new Date(res.body[0].date).toISOString()).toBe(body.date);
    });

    it('не возвращает встречи других пользователей', async () => {
      const alice = await registerUser();
      const bob = await registerUser();
      const aliceMeeting = await createMeeting(alice, validBody()).expect(201);
      const bobMeeting = await createMeeting(bob, validBody()).expect(201);

      const aliceList = await listMeetings(alice).expect(200);
      const bobList = await listMeetings(bob).expect(200);

      expect(aliceList.body.map((m: { id: string }) => m.id)).toEqual([
        aliceMeeting.body.id,
      ]);
      expect(bobList.body.map((m: { id: string }) => m.id)).toEqual([
        bobMeeting.body.id,
      ]);
    });
  });

  describe('GET /meetings/recent', () => {
    const recent = (token: string | null) => {
      const req = request(app.getHttpServer()).get('/meetings/recent');
      if (token) req.set('Authorization', `Bearer ${token}`);
      return req;
    };

    it('без токена возвращает 401', async () => {
      await recent(null).expect(401);
    });

    it('возвращает пустой список, если встреч нет', async () => {
      const token = await registerUser();
      const res = await recent(token).expect(200);
      expect(res.body).toEqual([]);
    });

    it('возвращает все встречи, если их меньше трёх', async () => {
      const token = await registerUser();
      const a = await createMeeting(token, validBody()).expect(201);
      const b = await createMeeting(token, validBody()).expect(201);

      const res = await recent(token).expect(200);

      expect(res.body.map((m: { id: string }) => m.id)).toEqual([
        b.body.id,
        a.body.id,
      ]);
    });

    it('возвращает 3 последние созданные встречи, новые первыми', async () => {
      const token = await registerUser();
      const ids: string[] = [];
      for (let i = 0; i < 5; i++) {
        const res = await createMeeting(token, validBody()).expect(201);
        ids.push(res.body.id);
      }

      const res = await recent(token).expect(200);

      expect(res.body.map((m: { id: string }) => m.id)).toEqual([
        ids[4],
        ids[3],
        ids[2],
      ]);
    });

    it('не включает чужие встречи', async () => {
      const alice = await registerUser();
      const bob = await registerUser();
      await createMeeting(alice, validBody()).expect(201);
      const mine = await createMeeting(bob, validBody()).expect(201);

      const res = await recent(bob).expect(200);

      expect(res.body.map((m: { id: string }) => m.id)).toEqual([
        mine.body.id,
      ]);
    });
  });

  describe('GET /meetings/:id', () => {
    it('возвращает встречу по id', async () => {
      const token = await registerUser();
      const body = validBody();
      const created = await createMeeting(token, body).expect(201);

      const res = await getMeeting(token, created.body.id).expect(200);

      expect(res.body).toMatchObject({
        id: created.body.id,
        title: body.title,
        participants: body.participants,
      });
      expect(new Date(res.body.date).toISOString()).toBe(body.date);
    });

    it('возвращает 404, если встреча не найдена', async () => {
      const token = await registerUser();
      // Без существующего роута Nest тоже вернёт 404, поэтому сначала
      // убеждаемся, что роут работает: встреча создаётся и читается.
      const created = await createMeeting(token, validBody()).expect(201);
      await getMeeting(token, created.body.id).expect(200);

      await getMeeting(token, randomUUID()).expect(404);
    });

    it('возвращает 404 на чужую встречу, не раскрывая её существование', async () => {
      const owner = await registerUser();
      const stranger = await registerUser();
      const created = await createMeeting(owner, validBody()).expect(201);

      await getMeeting(stranger, created.body.id).expect(404);
    });
  });
});
