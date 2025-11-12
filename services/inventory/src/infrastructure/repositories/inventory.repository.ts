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
    const docs = await this.model.find(filters).sort({ updatedAt: -1 }).lean();
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

  /**
   * ✅ Reserve stock for an order
   * Atomically decrements available stock and increments reserved stock
   * Ensures that available stock (stock - reserved) is sufficient
   *
   * @param sku - Product SKU
   * @param quantity - Quantity to reserve
   * @returns Updated inventory item
   * @throws Error if insufficient stock or item not found
   */
  async reserveStock(sku: string, quantity: number): Promise<InventoryItem> {
    // Use MongoDB's atomic operations to ensure consistency
    // Only reserve if: (stock - reserved) >= quantity
    const updated = await this.model
      .findOneAndUpdate(
        {
          sku,
          $expr: { $gte: [{ $subtract: ['$stock', '$reserved'] }, quantity] },
        },
        {
          $inc: { reserved: quantity },
        },
        { new: true }
      )
      .lean();

    if (!updated) {
      // Check if item exists
      const item = await this.model.findOne({ sku }).lean();
      if (!item) {
        throw new Error(`Item with SKU ${sku} not found`);
      }
      const available = item.stock - item.reserved;
      throw new Error(
        `Insufficient stock for SKU ${sku}. Available: ${available}, Required: ${quantity}`
      );
    }

    return InventoryMapper.toDomain(updated)!;
  }

  /**
   * ✅ Release reserved stock (e.g., when order is cancelled)
   * Atomically decrements reserved stock
   *
   * @param sku - Product SKU
   * @param quantity - Quantity to release
   * @returns Updated inventory item
   * @throws Error if item not found or insufficient reserved stock
   */
  async releaseReservedStock(sku: string, quantity: number): Promise<InventoryItem> {
    // Ensure we don't release more than reserved
    const updated = await this.model
      .findOneAndUpdate(
        {
          sku,
          reserved: { $gte: quantity },
        },
        {
          $inc: { reserved: -quantity },
        },
        { new: true }
      )
      .lean();

    if (!updated) {
      const item = await this.model.findOne({ sku }).lean();
      if (!item) {
        throw new Error(`Item with SKU ${sku} not found`);
      }
      throw new Error(
        `Cannot release ${quantity} items for SKU ${sku}. Reserved: ${item.reserved}`
      );
    }

    return InventoryMapper.toDomain(updated)!;
  }

  /**
   * ✅ Deduct stock when order is delivered
   * Atomically decrements both stock and reserved, increments sold
   *
   * @param sku - Product SKU
   * @param quantity - Quantity to deduct
   * @returns Updated inventory item
   * @throws Error if item not found or insufficient stock/reserved
   */
  async deductStock(sku: string, quantity: number): Promise<InventoryItem> {
    // Deduct from both stock and reserved, add to sold
    // Ensure both stock and reserved have sufficient quantity
    console.log('Attempting to deduct stock:', { sku, quantity });
    const updated = await this.model
      .findOneAndUpdate(
        {
          sku,
          stock: { $gte: quantity },
          reserved: { $gte: quantity },
        },
        {
          $inc: {
            stock: -quantity,
            reserved: -quantity,
            sold: quantity,
          },
        },
        { new: true }
      )
      .lean();

    if (!updated) {
      const item = await this.model.findOne({ sku }).lean();
      if (!item) {
        throw new Error(`Item with SKU ${sku} not found`);
      }

      if (item.stock < quantity) {
        throw new Error(
          `Insufficient stock for SKU ${sku}. Stock: ${item.stock}, Required: ${quantity}`
        );
      }

      if (item.reserved < quantity) {
        throw new Error(
          `Insufficient reserved stock for SKU ${sku}. Reserved: ${item.reserved}, Required: ${quantity}`
        );
      }

      throw new Error(`Failed to deduct stock for SKU ${sku}`);
    }

    return InventoryMapper.toDomain(updated)!;
  }

  /**
   * ✅ Batch reserve stock for multiple items
   * Attempts to reserve stock for all items in a transaction-like manner
   * If any item fails, returns the failing SKU
   *
   * @param items - Array of { sku, quantity } to reserve
   * @returns Object with success status and optional failedSku
   */
  async batchReserveStock(
    items: Array<{ sku: string; quantity: number }>
  ): Promise<{ success: boolean; failedSku?: string; message?: string }> {
    const reserved: Array<{ sku: string; quantity: number }> = [];

    try {
      for (const item of items) {
        await this.reserveStock(item.sku, item.quantity);
        reserved.push(item);
      }
      return { success: true };
    } catch (error: any) {
      // Rollback: release all successfully reserved items
      for (const item of reserved) {
        try {
          await this.releaseReservedStock(item.sku, item.quantity);
        } catch (rollbackError) {
          // Log rollback error but continue
          console.error(
            `Failed to rollback reservation for SKU ${item.sku}:`,
            rollbackError
          );
        }
      }

      // Extract failed SKU from error message
      const failedSku = reserved.length < items.length
        ? items[reserved.length].sku
        : items[items.length - 1].sku;

      return {
        success: false,
        failedSku,
        message: error.message || 'Stock reservation failed',
      };
    }
  }

  /**
   * ✅ Batch release reserved stock for multiple items
   *
   * @param items - Array of { sku, quantity } to release
   */
  async batchReleaseReservedStock(
    items: Array<{ sku: string; quantity: number }>
  ): Promise<void> {
    for (const item of items) {
      try {
        await this.releaseReservedStock(item.sku, item.quantity);
      } catch (error) {
        console.error(
          `Failed to release reserved stock for SKU ${item.sku}:`,
          error
        );
        // Continue with other items even if one fails
      }
    }
  }

  /**
   * ✅ Batch deduct stock for multiple items (on delivery)
   *
   * @param items - Array of { sku, quantity } to deduct
   */
  async batchDeductStock(
    items: Array<{ sku: string; quantity: number }>
  ): Promise<void> {
    for (const item of items) {
      try {
        await this.deductStock(item.sku, item.quantity);
      } catch (error) {
        console.error(
          `Failed to deduct stock for SKU ${item.sku}:`,
          error
        );
        // Continue with other items even if one fails
      }
    }
  }
}
