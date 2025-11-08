import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    process.env.MONGO_URI = uri; // ✅ your AppModule should use ConfigService to load this

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
    await app.close();
  });

  const orderPayload = {
    userId: 'user1',
    items: [{ productId: 'p1', quantity: 2 }],
    totalAmount: 300,
  };

  it('POST /orders', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send(orderPayload)
      .expect(201);

    expect(res.body.data.userId).toBe('user1');
  });
});
