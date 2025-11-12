import { Injectable, Logger } from '@nestjs/common';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { InventoryProducer } from '../../infrastructure/events/inventory.producer';
import { RedisLockService } from '../../infrastructure/redis/redis-lock.service';

/**
 * ✅ Reserve Stock Use Case
 *
 * Business Logic:
 * - Reserves inventory when an order is placed
 * - Uses distributed locking to prevent race conditions
 * - Ensures atomic stock reservation across multiple items
 * - Emits inventory events for downstream services
 * - Implements rollback on failure
 *
 * Flow:
 * 1. Acquire distributed lock for each SKU
 * 2. Check available stock (stock - reserved)
 * 3. Atomically increment reserved count
 * 4. Emit inventory.reserved event
 * 5. Release locks
 *
 * @Injectable
 */
@Injectable()
export class ReserveStockUseCase {
  private readonly logger = new Logger(ReserveStockUseCase.name);
  private readonly LOCK_TTL_MS = 5000; // 5 seconds lock timeout

  constructor(
    private readonly repository: InventoryRepository,
    private readonly producer: InventoryProducer,
    private readonly lockService: RedisLockService,
  ) {}

  /**
   * Reserve stock for a single item
   *
   * @param orderId - Order ID for tracking
   * @param sku - Product SKU
   * @param quantity - Quantity to reserve
   * @returns Success status and inventory details
   */
  async execute(
    orderId: string,
    sku: string,
    quantity: number,
  ): Promise<{ success: boolean; message?: string }> {
    const lockKey = `inventory:lock:${sku}`;
    let token: string | null = null;

    try {
      // Acquire distributed lock to prevent race conditions
      this.logger.debug(`Attempting to acquire lock for SKU: ${sku}`);
      token = await this.lockService.acquireLock(lockKey, this.LOCK_TTL_MS);

      if (!token) {
        this.logger.warn(`Failed to acquire lock for SKU: ${sku}`);
        return {
          success: false,
          message: `Unable to reserve stock for SKU ${sku}. System is busy, please try again.`,
        };
      }

      this.logger.log(`Lock acquired for SKU: ${sku}, reserving ${quantity} units`);

      // Reserve stock atomically
      const updatedInventory = await this.repository.reserveStock(sku, quantity);

      // Emit inventory reserved event
      await this.producer.publishStockReserved({
        orderId,
        sku,
        quantity,
        reservedStock: updatedInventory.reserved,
        availableStock: updatedInventory.stock - updatedInventory.reserved,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `✅ Successfully reserved ${quantity} units of SKU ${sku} for order ${orderId}. ` +
        `Total reserved: ${updatedInventory.reserved}, Available: ${updatedInventory.stock - updatedInventory.reserved}`
      );

      return { success: true };
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to reserve stock for SKU ${sku}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: error.message || `Failed to reserve stock for SKU ${sku}`,
      };
    } finally {
      // Always release the lock
      if (token) {
        try {
          await this.lockService.releaseLock(lockKey, token);
          this.logger.debug(`Lock released for SKU: ${sku}`);
        } catch (lockError) {
          this.logger.error(`Failed to release lock for SKU ${sku}:`, lockError);
        }
      }
    }
  }

  /**
   * Reserve stock for multiple items (batch operation)
   * Implements saga pattern with rollback on failure
   *
   * @param orderId - Order ID for tracking
   * @param items - Array of items to reserve
   * @returns Success status and details
   */
  async executeBatch(
    orderId: string,
    items: Array<{ sku: string; quantity: number }>,
  ): Promise<{ success: boolean; failedSku?: string; message?: string }> {
    const locks: Map<string, string> = new Map(); // sku -> token
    const reserved: Array<{ sku: string; quantity: number }> = [];

    try {
      this.logger.log(
        `Starting batch reservation for order ${orderId} with ${items.length} items`
      );

      // Step 1: Acquire all locks
      for (const item of items) {
        const lockKey = `inventory:lock:${item.sku}`;
        const token = await this.lockService.acquireLock(lockKey, this.LOCK_TTL_MS);

        if (!token) {
          throw new Error(`Failed to acquire lock for SKU ${item.sku}`);
        }

        locks.set(item.sku, token);
      }

      // Step 2: Reserve stock for all items
      for (const item of items) {
        try {
          const updatedInventory = await this.repository.reserveStock(
            item.sku,
            item.quantity,
          );

          reserved.push(item);

          // Emit event for each successful reservation
          await this.producer.publishStockReserved({
            orderId,
            sku: item.sku,
            quantity: item.quantity,
            reservedStock: updatedInventory.reserved,
            availableStock: updatedInventory.stock - updatedInventory.reserved,
            timestamp: new Date().toISOString(),
          });

          this.logger.debug(
            `Reserved ${item.quantity} units of SKU ${item.sku} for order ${orderId}`
          );
        } catch (error: any) {
          // Reservation failed for this item
          throw new Error(
            `Failed to reserve SKU ${item.sku}: ${error.message}`
          );
        }
      }

      this.logger.log(
        `✅ Successfully reserved stock for all ${items.length} items in order ${orderId}`
      );

      return { success: true };
    } catch (error: any) {
      this.logger.error(
        `❌ Batch reservation failed for order ${orderId}: ${error.message}`,
        error.stack,
      );

      // Rollback: Release all successfully reserved items
      if (reserved.length > 0) {
        this.logger.warn(
          `Rolling back ${reserved.length} successful reservations for order ${orderId}`
        );

        for (const item of reserved) {
          try {
            await this.repository.releaseReservedStock(item.sku, item.quantity);

            // Emit rollback event
            await this.producer.publishStockReservationRolledBack({
              orderId,
              sku: item.sku,
              quantity: item.quantity,
              reason: 'Batch reservation failure',
              timestamp: new Date().toISOString(),
            });

            this.logger.debug(
              `Rolled back reservation for SKU ${item.sku}, quantity: ${item.quantity}`
            );
          } catch (rollbackError: any) {
            this.logger.error(
              `❌ Failed to rollback reservation for SKU ${item.sku}: ${rollbackError.message}`
            );
            // Continue rollback for other items
          }
        }
      }

      // Determine which SKU failed
      const failedSku =
        reserved.length < items.length
          ? items[reserved.length].sku
          : items[items.length - 1].sku;

      return {
        success: false,
        failedSku,
        message: error.message || 'Batch stock reservation failed',
      };
    } finally {
      // Release all locks
      for (const [sku, token] of locks.entries()) {
        try {
          const lockKey = `inventory:lock:${sku}`;
          await this.lockService.releaseLock(lockKey, token);
        } catch (lockError) {
          this.logger.error(`Failed to release lock for SKU ${sku}:`, lockError);
        }
      }
    }
  }
}
