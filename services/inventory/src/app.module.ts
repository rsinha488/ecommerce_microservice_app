import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import inventoryConfig from './config/inventory.config';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryItemModel, InventoryItemSchema } from './infrastructure/database/inventory-item.schema';
import { RedisLockService } from './infrastructure/redis/redis-lock.service';
import { InventoryRepository } from './infrastructure/repositories/inventory.repository';
import { InventoryMapper } from './infrastructure/mappers/inventory.mapper';
import { CreateItemUseCase } from './application/use-cases/create-item.usecase';
import { GetItemUseCase } from './application/use-cases/get-item.usecase';
import { ListItemsUseCase } from './application/use-cases/list-items.usecase';
import { ReserveStockUseCase } from './application/use-cases/reserve-stock.usecase';
import { ReleaseReservedStockUseCase } from './application/use-cases/release-reserved-stock.usecase';
import { DeductStockUseCase } from './application/use-cases/deduct-stock.usecase';
import { InventoryController } from './presentation/controllers/inventory.controller';
import { InventoryProducer } from './infrastructure/events/inventory.producer';
import { OrderInventoryHandler } from './infrastructure/events/order-inventory.handler';
import { RedisModule } from './infrastructure/redis/redis.module';
import { InventoryDatabaseModule } from './infrastructure/database/database.module';
import { EventsModule } from './infrastructure/events/events.module';
import { KafkaModule } from './infrastructure/event-bus/kafka/kafka.module';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';

/**
 * ✅ Inventory Service Main Module
 *
 * Provides inventory management with:
 * - Stock reservation for orders
 * - Stock release on cancellation
 * - Stock deduction on delivery
 * - Distributed locking via Redis
 * - Event-driven communication via Kafka
 * - Real-time stock alerts
 *
 * Event Flow:
 * 1. order.created → Reserve stock
 * 2. order.cancelled → Release reserved stock
 * 3. order.delivered → Deduct stock (reduce stock & reserved, increment sold)
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [inventoryConfig] }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    MongooseModule.forFeature([{ name: InventoryItemModel.name, schema: InventoryItemSchema }]),

    RedisModule,
    KafkaModule,
    EventBusModule,
    InventoryDatabaseModule,
    EventsModule,
  ],

  controllers: [InventoryController],
  providers: [
    // Repository + Mapper
    InventoryRepository,
    InventoryMapper,

    // Use Cases - CRUD Operations
    CreateItemUseCase,
    GetItemUseCase,
    ListItemsUseCase,

    // Use Cases - Stock Operations (NEW)
    ReserveStockUseCase,
    ReleaseReservedStockUseCase,
    DeductStockUseCase,

    // Event Producers
    InventoryProducer,

    // Event Handlers (NEW)
    OrderInventoryHandler,
  ],
  exports: [
    CreateItemUseCase,
    GetItemUseCase,
    ListItemsUseCase,
    ReserveStockUseCase,
    ReleaseReservedStockUseCase,
    DeductStockUseCase,
  ],
})
export class AppModule {}
