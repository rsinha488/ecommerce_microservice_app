import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryItemModel, InventoryItemSchema } from './inventory-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: InventoryItemModel.name,
        schema: InventoryItemSchema,
      },
    ]),
  ],
  exports: [
    MongooseModule,
  ],
})
export class InventoryDatabaseModule {}
