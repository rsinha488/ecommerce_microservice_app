import { Injectable, Logger } from '@nestjs/common';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { InventoryProducer } from '../../infrastructure/events/inventory.producer';
import { RedisLockService } from '../../infrastructure/redis/redis-lock.service';

/**
 * ✅ Deduct Stock Use Case
 *
 * Business Logic:
 * - Deducts inventory when an order is delivered/completed
 * - Reduces both stock and reserved quantities
 * - Increments sold count for analytics
 * - Uses distributed locking to prevent race conditions
 * - Emits inventory events for downstream services
 *
 * Flow:
 * 1. Acquire distributed lock for each SKU
 * 2. Verify stock and reserved quantities are sufficient
 * 3. Atomically: decrement stock, decrement reserved, increment sold
 * 4. Emit inventory.deducted event
 * 5. Release locks
 *
 * Formula:
 * - stock = stock - quantity (actual physical stock reduction)
 * - reserved = reserved - quantity (release the reservation)
 * - sold = sold + quantity (track total sales)
 *
 * @Injectable
 */
@Injectable()
export class DeductStockUseCase {
  private readonly logger = new Logger(DeductStockUseCase.name);
  private readonly LOCK_TTL_MS = 5000; // 5 seconds lock timeout

  constructor(
    private readonly repository: InventoryRepository,
    private readonly producer: InventoryProducer,
    private readonly lockService: RedisLockService,
  ) {}

  /**
   * Deduct stock for a single item (on delivery/completion)
   *
   * @param orderId - Order ID for tracking
   * @param sku - Product SKU
   * @param quantity - Quantity to deduct
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
          message: `Unable to deduct stock for SKU ${sku}. System is busy, please try again.`,
        };
      }

      this.logger.log(
        `Lock acquired for SKU: ${sku}, deducting ${quantity} units for delivered order ${orderId}`
      );

      // Deduct stock atomically (reduces stock, reserved, and increments sold)
      const updatedInventory = await this.repository.deductStock(sku, quantity);

      // Emit inventory deducted event
      await this.producer.publishStockDeducted({
        orderId,
        sku,
        quantity,
        remainingStock: updatedInventory.stock,
        reservedStock: updatedInventory.reserved,
        totalSold: updatedInventory.sold,
        availableStock: updatedInventory.stock - updatedInventory.reserved,
        timestamp: new Date().toISOString(),
      });

      // Check if stock is low and emit low stock alert
      const availableStock = updatedInventory.stock - updatedInventory.reserved;
      if (availableStock <= 10 && availableStock > 0) {
        await this.producer.publishLowStockAlert({
          sku,
          currentStock: updatedInventory.stock,
          availableStock,
          reservedStock: updatedInventory.reserved,
          threshold: 10,
          timestamp: new Date().toISOString(),
        });

        this.logger.warn(
          `⚠️ LOW STOCK ALERT: SKU ${sku} has only ${availableStock} units available`
        );
      } else if (availableStock === 0) {
        await this.producer.publishOutOfStockAlert({
          sku,
          reservedStock: updatedInventory.reserved,
          totalSold: updatedInventory.sold,
          timestamp: new Date().toISOString(),
        });

        this.logger.error(
          `❌ OUT OF STOCK: SKU ${sku} is now out of stock (reserved: ${updatedInventory.reserved})`
        );
      }

      this.logger.log(
        `✅ Successfully deducted ${quantity} units of SKU ${sku} for order ${orderId}. ` +
        `Remaining stock: ${updatedInventory.stock}, Reserved: ${updatedInventory.reserved}, ` +
        `Available: ${availableStock}, Total sold: ${updatedInventory.sold}`
      );

      return { success: true };
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to deduct stock for SKU ${sku}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: error.message || `Failed to deduct stock for SKU ${sku}`,
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
   * Deduct stock for multiple items (batch operation)
   * Used when an order with multiple items is delivered
   *
   * @param orderId - Order ID for tracking
   * @param items - Array of items to deduct
   * @returns Success status and details
   */
  async executeBatch(
    orderId: string,
    items: Array<{ sku: string; quantity: number }>,
  ): Promise<{ success: boolean; failedItems?: string[]; message?: string }> {
    const locks: Map<string, string> = new Map(); // sku -> token
    const deducted: string[] = [];
    const failed: string[] = [];

    try {
      this.logger.log(
        `Starting batch deduction for order ${orderId} with ${items.length} items`
      );

      // Step 1: Acquire all locks
      for (const item of items) {
        const lockKey = `inventory:lock:${item.sku}`;
        const token = await this.lockService.acquireLock(lockKey, this.LOCK_TTL_MS);

        if (!token) {
          this.logger.warn(`Failed to acquire lock for SKU ${item.sku}`);
          failed.push(item.sku);
          continue; // Try to deduct others
        }

        locks.set(item.sku, token);
      }

      // Step 2: Deduct stock for all items
      for (const item of items) {
        // Skip items where we couldn't acquire lock
        if (!locks.has(item.sku)) {
          continue;
        }

        try {
          const updatedInventory = await this.repository.deductStock(
            item.sku,
            item.quantity,
          );

          deducted.push(item.sku);

          // Emit event for each successful deduction
          await this.producer.publishStockDeducted({
            orderId,
            sku: item.sku,
            quantity: item.quantity,
            remainingStock: updatedInventory.stock,
            reservedStock: updatedInventory.reserved,
            totalSold: updatedInventory.sold,
            availableStock: updatedInventory.stock - updatedInventory.reserved,
            timestamp: new Date().toISOString(),
          });

          // Check for low stock alerts
          const availableStock = updatedInventory.stock - updatedInventory.reserved;
          if (availableStock <= 10 && availableStock > 0) {
            await this.producer.publishLowStockAlert({
              sku: item.sku,
              currentStock: updatedInventory.stock,
              availableStock,
              reservedStock: updatedInventory.reserved,
              threshold: 10,
              timestamp: new Date().toISOString(),
            });
          } else if (availableStock === 0) {
            await this.producer.publishOutOfStockAlert({
              sku: item.sku,
              reservedStock: updatedInventory.reserved,
              totalSold: updatedInventory.sold,
              timestamp: new Date().toISOString(),
            });
          }

          this.logger.debug(
            `Deducted ${item.quantity} units of SKU ${item.sku} for order ${orderId}`
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to deduct stock for SKU ${item.sku}: ${error.message}`
          );
          failed.push(item.sku);
          // Continue with other items - partial deduction is acceptable
          // The failed items will need manual intervention or retry
        }
      }

      if (failed.length > 0) {
        this.logger.warn(
          `⚠️ Batch deduction completed with failures for order ${orderId}. ` +
          `Deducted: ${deducted.length}, Failed: ${failed.length}`
        );

        // Emit partial completion event
        await this.producer.publishPartialStockDeduction({
          orderId,
          deductedItems: deducted,
          failedItems: failed,
          timestamp: new Date().toISOString(),
        });

        return {
          success: false,
          failedItems: failed,
          message: `Failed to deduct stock for ${failed.length} item(s): ${failed.join(', ')}. ` +
                   `Successfully deducted ${deducted.length} item(s).`,
        };
      }

      this.logger.log(
        `✅ Successfully deducted stock for all ${items.length} items in order ${orderId}`
      );

      return { success: true };
    } catch (error: any) {
      this.logger.error(
        `❌ Batch deduction failed for order ${orderId}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        failedItems: failed,
        message: error.message || 'Batch stock deduction failed',
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
   * Deduct stock with automatic retry
   * Useful for handling transient failures in critical delivery scenarios
   *
   * @param orderId - Order ID for tracking
   * @param sku - Product SKU
   * @param quantity - Quantity to deduct
   * @param maxRetries - Maximum number of retry attempts
   * @returns Success status
   */
  async executeWithRetry(
    orderId: string,
    sku: string,
    quantity: number,
    maxRetries: number = 3,
  ): Promise<{ success: boolean; message?: string }> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.execute(orderId, sku, quantity);

      if (result.success) {
        if (attempt > 1) {
          this.logger.log(
            `✅ Deduction succeeded on retry attempt ${attempt} for SKU ${sku}`
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
      `❌ Failed to deduct stock for SKU ${sku} after ${maxRetries} attempts`
    );

    return {
      success: false,
      message: `Failed after ${maxRetries} attempts: ${lastError}`,
    };
  }
}
