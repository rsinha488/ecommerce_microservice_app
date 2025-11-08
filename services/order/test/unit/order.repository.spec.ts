import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { OrderRepository } from '../../src/infrastructure/repositories/order.repository';
import { OrderModelName, OrderSchema } from '../../src/infrastructure/database/order.schema';

describe('OrderRepository', () => {
  let mongo: MongoMemoryServer;
  let repository: OrderRepository;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());

    const model = mongoose.model(OrderModelName.name, OrderSchema);

    repository = new OrderRepository(model);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('should create an order', async () => {
    const created = await repository.create({
      userId: 'u1',
      items: [{ productId: 'p1', quantity: 2 }],
      totalAmount: 300,
      status: 'pending',
    });

    expect(created.userId).toBe('u1');
  });
});
