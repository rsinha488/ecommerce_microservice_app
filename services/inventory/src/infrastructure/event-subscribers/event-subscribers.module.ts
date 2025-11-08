// import { Module } from '@nestjs/common';
// import { RedisModule } from '../redis/redis.module';
// import { OrderCreatedSubscriber } from './order-created.subscriber';
// import { OrderUpdatedSubscriber } from './order-updated.subscriber';
// import { InventoryRepository } from '../repositories/inventory.repository';
// import { InventoryMapper } from '../mappers/inventory.mapper';
// import { RedisLockService } from '../redis/redis-lock.service';
// import { InventoryDatabaseModule } from '../database/database.module';

// @Module({
//   imports: [
//     RedisModule,
//     InventoryDatabaseModule, // ✅ FIX: Register model here
//   ],
//   providers: [
//     OrderCreatedSubscriber,
//     OrderUpdatedSubscriber,
//     InventoryRepository,
//     InventoryMapper,
//     RedisLockService,
//   ],
// })
// export class EventSubscribersModule {}
