import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<ProductModel>;

@Schema({ timestamps: true })
export class ProductModel {
  @Prop({ required: true, index: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, index: true })
  price!: number;

  @Prop({ required: true, unique: true })
  sku!: string; // ✅ Used for Kafka events and inventory syncing

  @Prop({ required: true, index: true })
  category!: string;

  @Prop({ required: true })
  stock!: number;

  @Prop([String])
  images!: string[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(ProductModel);

/**
 * ✅ Compound index for text-based searches
 * Improves: search by name/description + category filtering
 */
ProductSchema.index({ name: 'text', description: 'text', category: 1 });

/**
 * ✅ SKU index for sharding + extremely fast lookups
 */
ProductSchema.index({ sku: 1 });
