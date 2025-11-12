import { Injectable, Logger } from '@nestjs/common';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { InventoryProducer } from '../../infrastructure/events/inventory.producer';
import { RedisLockService } from '../../infrastructure/redis/redis-lock.service';

/**
 * ✅ Release Reserved Stock Use Case
 *
 * Business Logic:
 * - Releases reserved inventory when an order is cancelled
 * - Uses distributed locking to prevent race conditions
 * - Makes stock available again for other orders
 * - Emits inventory events for downstream services
 *
 * Flow:
 * 1. Acquire distributed lock for each SKU
 * 2. Check reserved stock availability
 * 3. Atomically decrement reserved count
 * 4. Emit inventory.released event
 * 5. Release locks
 *
 * @Injectable
 */
@Injectable()
export class ReleaseReservedStockUseCase {
  private readonly logger = new Logger(ReleaseReservedStockUseCase.name);
  private readonly LOCK_TTL_MS = 5000; // 5 seconds lock timeout

  constructor(
    private readonly repository: InventoryRepository,
    private readonly producer: InventoryProducer,
    private readonly lockService: RedisLockService,
  ) {}

  /**
   * Release reserved stock for a single item
   *
   * @param orderId - Order ID for tracking
   * @param sku - Product SKU
   * @param quantity - Quantity to release
   * @param reason - Reason for release (e.g., 'order_cancelled', 'payment_failed')
   * @returns Success status and inventory details
   */
  async execute(
    orderId: string,
    sku: string,
    quantity: number,
    reason: string = 'order_cancelled',
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
          message: `Unable to release reserved stock for SKU ${sku}. System is busy, please try again.`,
        };
      }

      this.logger.log(
        `Lock acquired for SKU: ${sku}, releasing ${quantity} reserved units (reason: ${reason})`
      );

      // Release reserved stock atomically
      const updatedInventory = await this.repository.releaseReservedStock(sku, quantity);

      // Emit inventory released event
      await this.producer.publishStockReleased({
        orderId,
        sku,
        quantity,
        reservedStock: updatedInventory.reserved,
        availableStock: updatedInventory.stock - updatedInventory.reserved,
        reason,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `✅ Successfully released ${quantity} reserved units of SKU ${sku} for order ${orderId}. ` +
        `Total reserved: ${updatedInventory.reserved}, Available: ${updatedInventory.stock - updatedInventory.reserved}`
      );

      return { success: true };
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to release reserved stock for SKU ${sku}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: error.message || `Failed to release reserved stock for SKU ${sku}`,
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
   * Release reserved stock for multiple items (batch operation)
   *
   * @param orderId - Order ID for tracking
   * @param items - Array of items to release
   * @param reason - Reason for release
   * @returns Success status and details
   */
  async executeBatch(
    orderId: string,
    items: Array<{ sku: string; quantity: number }>,
    reason: string = 'order_cancelled',
  ): Promise<{ success: boolean; failedItems?: string[]; message?: string }> {
    const locks: Map<string, string> = new Map(); // sku -> token
    const released: string[] = [];
    const failed: string[] = [];

    try {
      this.logger.log(
        `Starting batch release for order ${orderId} with ${items.length} items (reason: ${reason})`
      );

      // Step 1: Acquire all locks
      for (const item of items) {
        const lockKey = `inventory:lock:${item.sku}`;
        const token = await this.lockService.acquireLock(lockKey, this.LOCK_TTL_MS);

        if (!token) {
          this.logger.warn(`Failed to acquire lock for SKU ${item.sku}`);
          failed.push(item.sku);
          continue; // Try to release others
        }

        locks.set(item.sku, token);
      }

      // Step 2: Release reserved stock for all items
      for (const item of items) {
        // Skip items where we couldn't acquire lock
        if (!locks.has(item.sku)) {
          continue;
        }

        try {
          const updatedInventory = await this.repository.releaseReservedStock(
            item.sku,
            item.quantity,
          );

          released.push(item.sku);

          // Emit event for each successful release
          await this.producer.publishStockReleased({
            orderId,
            sku: item.sku,
            quantity: item.quantity,
            reservedStock: updatedInventory.reserved,
            availableStock: updatedInventory.stock - updatedInventory.reserved,
            reason,
            timestamp: new Date().toISOString(),
          });

          this.logger.debug(
            `Released ${item.quantity} reserved units of SKU ${item.sku} for order ${orderId}`
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to release reserved stock for SKU ${item.sku}: ${error.message}`
          );
          failed.push(item.sku);
          // Continue with other items
        }
      }

      if (failed.length > 0) {
        this.logger.warn(
          `⚠️ Batch release completed with failures for order ${orderId}. ` +
          `Released: ${released.length}, Failed: ${failed.length}`
        );

        return {
          success: false,
          failedItems: failed,
          message: `Failed to release reserved stock for ${failed.length} item(s): ${failed.join(', ')}`,
        };
      }

      this.logger.log(
        `✅ Successfully released reserved stock for all ${items.length} items in order ${orderId}`
      );

      return { success: true };
    } catch (error: any) {
      this.logger.error(
        `❌ Batch release failed for order ${orderId}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        failedItems: failed,
        message: error.message || 'Batch stock release failed',
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

  /**
   * Release reserved stock with automatic retry
   * Useful for handling transient failures
   *
   * @param orderId - Order ID for tracking
   * @param sku - Product SKU
   * @param quantity - Quantity to release
   * @param reason - Reason for release
   * @param maxRetries - Maximum number of retry attempts
   * @returns Success status
   */
  async executeWithRetry(
    orderId: string,
    sku: string,
    quantity: number,
    reason: string = 'order_cancelled',
    maxRetries: number = 3,
  ): Promise<{ success: boolean; message?: string }> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.execute(orderId, sku, quantity, reason);

      if (result.success) {
        if (attempt > 1) {
          this.logger.log(
            `✅ Release succeeded on retry attempt ${attempt} for SKU ${sku}`
          );
        }
        return result;
      }

      lastError = result.message;
      this.logger.warn(
        `Retry ${attempt}/${maxRetries} failed for SKU ${sku}: ${result.message}`
      );

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    this.logger.error(
      `❌ Failed to release reserved stock for SKU ${sku} after ${maxRetries} attempts`
    );

    return {
      success: false,
      message: `Failed after ${maxRetries} attempts: ${lastError}`,
    };
  }
}
