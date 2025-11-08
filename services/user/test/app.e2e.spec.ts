import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getConnectionToken } from '@nestjs/mongoose';

import { TestAppModule } from './test-app.module';
import { RedisService } from '../src/infrastructure/redis/redis.service';

jest.setTimeout(20000); // ✅ Increase timeout

describe('UserService E2E', () => {
  let app: INestApplication;
  let mongoConnection: any;
  let redisService: RedisService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mongoConnection = moduleFixture.get(getConnectionToken());
    redisService = moduleFixture.get('RedisService'); // ✅ Use mocked Redis
  });

  beforeEach(async () => {
    await mongoConnection.db.dropDatabase();
  });

  it('POST /users → should create user', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret123',
      });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('test@example.com');
  });

  it('GET /users → should return list', async () => {
    await request(app.getHttpServer()).post('/users').send({
      name: 'Test',
      email: 'test2@example.com',
      password: 'abc123',
    });

    const res = await request(app.getHttpServer()).get('/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  afterAll(async () => {
    await mongoConnection.close();

    // ✅ safe mock cleanup
    if (redisService.quit) await redisService.quit();

    await app.close();
  });
});
