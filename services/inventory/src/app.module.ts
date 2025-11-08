import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import inventoryConfig from './config/inventory.config';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryItemModel, InventoryItemSchema } from './infrastructure/database/inventory-item.schema';
import { RedisLockService } from './infrastructure/redis/redis-lock.service';
import { InventoryRepository } from './infrastructure/repositories/inventory.repository';
import { InventoryMapper } from './infrastructure/mappers/inventory.mapper';
import { CreateItemUseCase } from './application/use-cases/create-item.usecase';
// import { AdjustStockUseCase } from './application/use-cases/adjust-stock.usecase';
import { GetItemUseCase } from './application/use-cases/get-item.usecase';
import { ListItemsUseCase } from './application/use-cases/list-items.usecase';
import { InventoryController } from './presentation/controllers/inventory.controller';
import { InventoryProducer } from './infrastructure/events/inventory.producer';
import { RedisModule } from './infrastructure/redis/redis.module';
// import { EventSubscribersModule } from './infrastructure/event-subscribers/event-subscribers.module';
import { InventoryDatabaseModule } from './infrastructure/database/database.module';
import { EventsModule } from './infrastructure/events/events.module';
import { KafkaModule } from './infrastructure/event-bus/kafka/kafka.module';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [inventoryConfig] }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    MongooseModule.forFeature([{ name: InventoryItemModel.name, schema: InventoryItemSchema }]),
  
    RedisModule, 
    // EventSubscribersModule,  
    KafkaModule,
    EventBusModule, 
    InventoryDatabaseModule,  
    EventsModule,    
  ],
  
  controllers: [InventoryController],
  providers: [
    // repository + mapper
    InventoryRepository,
    InventoryMapper,

    // use-cases
    CreateItemUseCase,
    // AdjustStockUseCase,
    GetItemUseCase,
    ListItemsUseCase,

    // producers / infra
    InventoryProducer,
  ],
  exports: [CreateItemUseCase, 
    // AdjustStockUseCase, 
    GetItemUseCase, ListItemsUseCase],
})
export class AppModule {}
