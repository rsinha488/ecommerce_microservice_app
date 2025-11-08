import { Module } from '@nestjs/common';
import { InventoryEventHandler } from './inventory-event.handler';
import { CreateItemUseCase } from '../../application/use-cases/create-item.usecase';
import { InventoryRepository } from '../repositories/inventory.repository';
import { InventoryMapper } from '../mappers/inventory.mapper';
import { InventoryProducer } from './inventory.producer';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryItemModel, InventoryItemSchema } from '../database/inventory-item.schema';
import { InventoryDatabaseModule } from '../database/database.module';

@Module({
  imports: [
    // ✅ gives access to InventoryRepository, schema, etc.
    InventoryDatabaseModule,

    // ✅ ensures mongoose schema is loaded inside this module as well
    MongooseModule.forFeature([
      { name: InventoryItemModel.name, schema: InventoryItemSchema },
    ]),
  ],

  providers: [
    // ✅ event handler (Kafka consumer)
    InventoryEventHandler,

    // ✅ use-case (needs InventoryRepository)
    CreateItemUseCase,

    // ✅ dependencies required by use-case
    InventoryRepository,
    InventoryMapper,
    InventoryProducer,
  ],

  exports: [
    // ✅ allow other modules to use them if needed
    CreateItemUseCase,
  ],
})
export class EventsModule {}
