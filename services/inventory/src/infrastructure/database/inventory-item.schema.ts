import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InventoryItemDocument = HydratedDocument<InventoryItemModel>;

@Schema({ timestamps: true })
export class InventoryItemModel {
  @Prop({ required: true, unique: true})
  sku!: string;

  @Prop({ required: true, default: 0 })
  stock!: number;

  @Prop({ required: true, default: 0 })
  reserved!: number;

  @Prop({ required: true, default: 0 })
  sold!: number;

  @Prop()
  location?: string;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItemModel);
InventoryItemSchema.index({ sku: 1 });
