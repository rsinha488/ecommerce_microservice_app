import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../event-bus/event-bus.service';

/**
 * ✅ Inventory Event Producer
 *
 * Publishes inventory-related events to Kafka topics
 * These events are consumed by other microservices (Order, Realtime, Analytics, etc.)
 *
 * Event Types:
 * - inventory.reserved: Stock reserved for an order
 * - inventory.released: Reserved stock released (order cancelled)
 * - inventory.deducted: Stock deducted (order delivered)
 * - inventory.low_stock: Low stock alert
 * - inventory.out_of_stock: Out of stock alert
 * - inventory.updated: General inventory update
 *
 * @Injectable
 */
@Injectable()
export class InventoryProducer {
  private readonly logger = new Logger(InventoryProducer.name);

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Publish stock reserved event
   * Triggered when stock is reserved for an order
   */
  async publishStockReserved(payload: {
    orderId: string;
    sku: string;
    quantity: number;
    reservedStock: number;
    availableStock: number;
    timestamp: string;
  }): Promise<void> {
    try {
      await this.eventBus.emit('inventory.reserved', {
        event: 'inventory.reserved',
        ...payload,
      });
      this.logger.log(
        `📤 Stock reserved event published for SKU ${payload.sku}, quantity: ${payload.quantity}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish stock reserved event for SKU ${payload.sku}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Publish stock released event
   * Triggered when reserved stock is released (e.g., order cancelled)
   */
  async publishStockReleased(payload: {
    orderId: string;
    sku: string;
    quantity: number;
    reservedStock: number;
    availableStock: number;
    reason: string;
    timestamp: string;
  }): Promise<void> {
    try {
      await this.eventBus.emit('inventory.released', {
        event: 'inventory.released',
        ...payload,
      });
      this.logger.log(
        `📤 Stock released event published for SKU ${payload.sku}, quantity: ${payload.quantity}, reason: ${payload.reason}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish stock released event for SKU ${payload.sku}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Publish stock deducted event
   * Triggered when stock is deducted (order delivered/completed)
   */
  async publishStockDeducted(payload: {
    orderId: string;
    sku: string;
    quantity: number;
    remainingStock: number;
    reservedStock: number;
    totalSold: number;
    availableStock: number;
    timestamp: string;
  }): Promise<void> {
    try {
      await this.eventBus.emit('inventory.deducted', {
        event: 'inventory.deducted',
        ...payload,
      });
      this.logger.log(
        `📤 Stock deducted event published for SKU ${payload.sku}, quantity: ${payload.quantity}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish stock deducted event for SKU ${payload.sku}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Publish low stock alert
   * Triggered when available stock falls below threshold
   */
  async publishLowStockAlert(payload: {
    sku: string;
    currentStock: number;
    availableStock: number;
    reservedStock: number;
    threshold: number;
    timestamp: string;
  }): Promise<void> {
    try {
      await this.eventBus.emit('inventory.low_stock', {
        event: 'inventory.low_stock',
        ...payload,
      });
      this.logger.warn(
        `⚠️ Low stock alert published for SKU ${payload.sku}, available: ${payload.availableStock}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish low stock alert for SKU ${payload.sku}:`,
        error
      );
      // Don't throw - low stock alert is not critical
    }
  }

  /**
   * Publish out of stock alert
   * Triggered when available stock reaches zero
   */
  async publishOutOfStockAlert(payload: {
    sku: string;
    reservedStock: number;
    totalSold: number;
    timestamp: string;
  }): Promise<void> {
    try {
      await this.eventBus.emit('inventory.out_of_stock', {
        event: 'inventory.out_of_stock',
        ...payload,
      });
      this.logger.error(
        `❌ Out of stock alert published for SKU ${payload.sku}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish out of stock alert for SKU ${payload.sku}:`,
        error
      );
      // Don't throw - out of stock alert is not critical
    }
  }

  /**
   * Publish reservation rollback event
   * Triggered when reservation needs to be rolled back due to failure
   */
  async publishStockReservationRolledBack(payload: {
    orderId: string;
    sku: string;
    quantity: number;
    reason: string;
    timestamp: string;
  }): Promise<void> {
    try {
      await this.eventBus.emit('inventory.reservation_rolled_back', {
        event: 'inventory.reservation_rolled_back',
        ...payload,
      });
      this.logger.warn(
        `⚠️ Reservation rollback event published for SKU ${payload.sku}, reason: ${payload.reason}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish reservation rollback event for SKU ${payload.sku}:`,
        error
      );
      // Don't throw - rollback event is informational
    }
  }

  /**
   * Publish partial stock deduction event
   * Triggered when batch deduction partially succeeds
   */
  async publishPartialStockDeduction(payload: {
    orderId: string;
    deductedItems: string[];
    failedItems: string[];
    timestamp: string;
  }): Promise<void> {
    try {
      await this.eventBus.emit('inventory.partial_deduction', {
        event: 'inventory.partial_deduction',
        ...payload,
      });
      this.logger.warn(
        `⚠️ Partial deduction event published for order ${payload.orderId}, ` +
        `succeeded: ${payload.deductedItems.length}, failed: ${payload.failedItems.length}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish partial deduction event for order ${payload.orderId}:`,
        error
      );
      // Don't throw - partial deduction event is informational
    }
  }

  /**
   * Publish general inventory updated event
   * Used for backwards compatibility and general updates
   */
  async publishInventoryUpdated(payload: {
    sku: string;
    stock: number;
    reserved: number;
    sold: number;
    availableStock: number;
    previousStock?: number;
    productId?: string;
    productName?: string;
    timestamp: string;
  }): Promise<void> {
    try {
      await this.eventBus.emit('inventory.updated', {
        event: 'inventory.updated',
        ...payload,
      });
      this.logger.log(
        `📤 Inventory updated event published for SKU ${payload.sku}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish inventory updated event for SKU ${payload.sku}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Legacy method for backwards compatibility
   * @deprecated Use specific publish methods instead
   */
  async publishStockChanged(payload: {
    sku: string;
    newStock: number;
    delta: number;
  }): Promise<void> {
    this.logger.warn(
      `⚠️ publishStockChanged is deprecated. Use publishInventoryUpdated instead.`
    );
    await this.publishInventoryUpdated({
      sku: payload.sku,
      stock: payload.newStock,
      reserved: 0,
      sold: 0,
      availableStock: payload.newStock,
      timestamp: new Date().toISOString(),
    });
  }
}
