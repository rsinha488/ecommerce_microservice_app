import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  InventoryItemModel,            // ✅ Correct class name from your schema
  InventoryItemDocument,         // ✅ Document type
} from '../database/inventory-item.schema';

import { InventoryItem } from '../../domain/entities/inventory-item.entity';
import { InventoryMapper } from '../mappers/inventory.mapper';

@Injectable()
export class InventoryRepository {
  constructor(
    @InjectModel(InventoryItemModel.name)          // ✅ FIX: correct injection token
    private readonly model: Model<InventoryItemDocument>,
  ) {}

  async create(item: Partial<InventoryItem>): Promise<InventoryItem> {
    const doc = await this.model.create(item);
    return InventoryMapper.toDomain(doc.toObject())!;
  }

  async findBySku(sku: string): Promise<InventoryItem | null> {
    const doc = await this.model.findOne({ sku }).lean();
    return InventoryMapper.toDomain(doc);
  }

  async adjustStock(sku: string, delta: number): Promise<InventoryItem> {
    const updated = await this.model
      .findOneAndUpdate(
        { sku },
        { $inc: { stock: delta } },
        { new: true, upsert: false }
      )
      .lean();

    if (!updated) throw new Error('Item not found');

    return InventoryMapper.toDomain(updated)!;
  }

  async list(filters: any): Promise<InventoryItem[]> {
    const docs = await this.model.find(filters).lean();
    return docs.map((d) => InventoryMapper.toDomain(d)!);
  }

  /**
   * ✅ Required by Redis subscribers (order.created / order.updated)
   */
  async update(entity: InventoryItem): Promise<InventoryItem> {
    const updated = await this.model
      .findOneAndUpdate({ sku: entity.sku }, entity, { new: true })
      .lean();

    if (!updated) throw new Error('Item not found');

    return InventoryMapper.toDomain(updated)!;
  }

  /**
   * ✅ Safer granular update method
   */
  async updateFields(
    sku: string,
    fields: Partial<InventoryItem>,
  ): Promise<InventoryItem> {
    const updated = await this.model
      .findOneAndUpdate({ sku }, { $set: fields }, { new: true })
      .lean();

    if (!updated) throw new Error('Item not found');

    return InventoryMapper.toDomain(updated)!;
  }
}
