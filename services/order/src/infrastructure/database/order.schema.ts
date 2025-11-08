import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<OrderModel>;

@Schema({ timestamps: true })
export class OrderModel {
  @Prop({ required: true, index: true })
  orderId!: string;

  @Prop({ required: true })
  buyerId!: string;

  @Prop({ type: Array, default: [] })
  items!: any[];

  @Prop({ required: true })
  total!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ default: 'pending' })
  status!: string;
}

export const OrderSchema = SchemaFactory.createForClass(OrderModel);
export const OrderModelName = 'OrderModel';
export { OrderModel as OrderModelClass };
