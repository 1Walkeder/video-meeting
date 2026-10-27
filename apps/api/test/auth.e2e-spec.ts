import { createHmac, randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

const JWT_SECRET = 'e2e-test-secret-at-least-32-characters-long';
const PASSWORD = 'Str0ng-Passw0rd!';

// Каждый тест использует уникальный e-mail, поэтому очистка БД между тестами не нужна.
const uniqueEmail = () => `user-${randomUUID()}@example.com`;

const decodeSegment = (segment: string) =>
  JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));

const isValidHs256Signature = (token: string, secret: string) => {
  const [header, payload, signature] = token.split('.');
  const expected = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return signature === expected;
};

describe('Auth (e2e)', () => {
  let app: INestApplication;

  const register = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/auth/register').send(body);

  const login = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/auth/login').send(body);

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('создаёт пользователя и возвращает JWT токен', async () => {
      const email = uniqueEmail();

      const res = await register({ email, password: PASSWORD }).expect(201);

      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.accessToken.split('.')).toHaveLength(3);
    });

    it('токен подписан JWT_SECRET и содержит sub, email и exp', async () => {
      const email = uniqueEmail();

      const res = await register({ email, password: PASSWORD }).expect(201);
      const token: string = res.body.accessToken;
      const [header, payload] = token.split('.');

      expect(decodeSegment(header)).toMatchObject({ alg: 'HS256', typ: 'JWT' });
      expect(isValidHs256Signature(token, JWT_SECRET)).toBe(true);
      expect(decodeSegment(payload)).toMatchObject({
        sub: expect.anything(),
        email,
        exp: expect.any(Number),
      });
    });

    it('после регистрации пользователь существует: логин с теми же данными успешен', async () => {
      const email = uniqueEmail();

      await register({ email, password: PASSWORD }).expect(201);
      const res = await login({ email, password: PASSWORD }).expect(200);

      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it('токены регистрации и логина принадлежат одному пользователю (одинаковый sub)', async () => {
      const email = uniqueEmail();

      const registered = await register({ email, password: PASSWORD }).expect(
        201,
      );
      const loggedIn = await login({ email, password: PASSWORD }).expect(200);

      const sub = (token: string) => decodeSegment(token.split('.')[1]).sub;
      expect(sub(loggedIn.body.accessToken)).toBe(
        sub(registered.body.accessToken),
      );
    });

    it('не возвращает пароль и его хэш в ответе', async () => {
      const res = await register({
        email: uniqueEmail(),
        password: PASSWORD,
      }).expect(201);

      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain(PASSWORD);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('возвращает 409, если пользователь с таким e-mail уже существует', async () => {
      const email = uniqueEmail();

      await register({ email, password: PASSWORD }).expect(201);
      await register({ email, password: 'Another-Passw0rd!' }).expect(409);
    });

    it('e-mail нечувствителен к регистру: повторная регистрация с другим регистром даёт 409', async () => {
      const email = uniqueEmail();

      await register({ email, password: PASSWORD }).expect(201);
      await register({ email: email.toUpperCase(), password: PASSWORD }).expect(
        409,
      );
    });

    it('повторная регистрация не меняет пароль существующего пользователя', async () => {
      const email = uniqueEmail();
      const newPassword = 'Another-Passw0rd!';

      await register({ email, password: PASSWORD }).expect(201);
      await register({ email, password: newPassword }).expect(409);

      await login({ email, password: PASSWORD }).expect(200);
      await login({ email, password: newPassword }).expect(401);
    });

    it.each([
      ['не передан e-mail', { password: PASSWORD }],
      ['не передан пароль', { email: 'no-password@example.com' }],
      ['пустое тело', {}],
      ['невалидный e-mail', { email: 'not-an-email', password: PASSWORD }],
      [
        'слишком короткий пароль',
        { email: 'short@example.com', password: '123' },
      ],
      ['e-mail не строка', { email: 123, password: PASSWORD }],
      ['пароль не строка', { email: 'nan@example.com', password: 123456789 }],
    ])('возвращает 400: %s', async (_name, body) => {
      await register(body).expect(400);
    });

    it('при невалидных данных пользователь не создаётся', async () => {
      const email = uniqueEmail();

      await register({ email, password: '123' }).expect(400);

      await login({ email, password: '123' }).expect(401);
      // Тот же e-mail всё ещё свободен для нормальной регистрации.
      await register({ email, password: PASSWORD }).expect(201);
    });
  });

  describe('POST /auth/login', () => {
    it('возвращает JWT токен для существующего пользователя', async () => {
      const email = uniqueEmail();
      await register({ email, password: PASSWORD }).expect(201);

      const res = await login({ email, password: PASSWORD }).expect(200);
      const token: string = res.body.accessToken;

      expect(token.split('.')).toHaveLength(3);
      expect(isValidHs256Signature(token, JWT_SECRET)).toBe(true);
      expect(decodeSegment(token.split('.')[1])).toMatchObject({
        sub: expect.anything(),
        email,
        exp: expect.any(Number),
      });
    });

    it('e-mail при логине нечувствителен к регистру', async () => {
      const email = uniqueEmail();
      await register({ email, password: PASSWORD }).expect(201);

      await login({ email: email.toUpperCase(), password: PASSWORD }).expect(
        200,
      );
    });

    it('возвращает 401, если пользователя с таким e-mail нет', async () => {
      await login({ email: uniqueEmail(), password: PASSWORD }).expect(401);
    });

    it('возвращает 401 при неверном пароле', async () => {
      const email = uniqueEmail();
      await register({ email, password: PASSWORD }).expect(201);

      const res = await login({ email, password: 'Wrong-Passw0rd!' }).expect(
        401,
      );

      expect(res.body).not.toHaveProperty('accessToken');
    });

    it('не раскрывает, существует ли e-mail: одинаковое сообщение для неверного пароля и несуществующего пользователя', async () => {
      const email = uniqueEmail();
      await register({ email, password: PASSWORD }).expect(201);

      const wrongPassword = await login({
        email,
        password: 'Wrong-Passw0rd!',
      }).expect(401);
      const unknownUser = await login({
        email: uniqueEmail(),
        password: PASSWORD,
      }).expect(401);

      expect(wrongPassword.body).toEqual(unknownUser.body);
    });

    it('НЕ создаёт пользователя: после неудачного логина логин с теми же данными по-прежнему 401', async () => {
      const email = uniqueEmail();

      await login({ email, password: PASSWORD }).expect(401);
      await login({ email, password: PASSWORD }).expect(401);
    });

    it('НЕ создаёт пользователя: после неудачного логина e-mail остаётся свободным для регистрации', async () => {
      const email = uniqueEmail();

      await login({ email, password: PASSWORD }).expect(401);

      // Если бы логин создал пользователя, здесь был бы 409.
      await register({ email, password: PASSWORD }).expect(201);
    });

    it('НЕ создаёт пользователя: неудачный логин не занимает пароль — регистрация с другим паролем работает', async () => {
      const email = uniqueEmail();

      await login({ email, password: 'Some-Passw0rd!' }).expect(401);
      await register({ email, password: PASSWORD }).expect(201);

      await login({ email, password: PASSWORD }).expect(200);
      await login({ email, password: 'Some-Passw0rd!' }).expect(401);
    });

    it.each([
      ['не передан e-mail', { password: PASSWORD }],
      ['не передан пароль', { email: 'no-password@example.com' }],
      ['пустое тело', {}],
      ['невалидный e-mail', { email: 'not-an-email', password: PASSWORD }],
      ['e-mail не строка', { email: 123, password: PASSWORD }],
      ['пароль не строка', { email: 'nan@example.com', password: 123456789 }],
    ])('возвращает 400: %s', async (_name, body) => {
      await login(body).expect(400);
    });
  });
});
