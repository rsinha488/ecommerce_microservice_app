import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaConsumer } from '../event-bus/kafka/kafka.consumer';
import { ReserveStockUseCase } from '../../application/use-cases/reserve-stock.usecase';
import { ReleaseReservedStockUseCase } from '../../application/use-cases/release-reserved-stock.usecase';
import { DeductStockUseCase } from '../../application/use-cases/deduct-stock.usecase';

/**
 * ✅ Order-Inventory Event Handler
 *
 * Handles order lifecycle events and manages inventory accordingly:
 *
 * Order Created (pending) → Reserve Stock
 * - Reserves inventory for all items in the order
 * - Ensures stock availability before order proceeds
 * - Emits inventory.reserved events
 *
 * Order Cancelled → Release Reserved Stock
 * - Returns reserved stock back to available pool
 * - Makes stock available for other orders
 * - Emits inventory.released events
 *
 * Order Delivered → Deduct Stock
 * - Reduces actual stock count
 * - Releases reservation
 * - Increments sold counter
 * - Emits inventory.deducted events
 * - Triggers low stock alerts if needed
 *
 * Order Shipped → (No Action)
 * - Stock remains reserved until delivery
 *
 * Order Paid → (No Action)
 * - Stock remains reserved
 *
 * @Injectable
 */
@Injectable()
export class OrderInventoryHandler implements OnModuleInit {
  private readonly logger = new Logger(OrderInventoryHandler.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumer,
    private readonly reserveStockUseCase: ReserveStockUseCase,
    private readonly releaseReservedStockUseCase: ReleaseReservedStockUseCase,
    private readonly deductStockUseCase: DeductStockUseCase,
  ) {}

  /**
   * Subscribe to order events on module initialization
   */
  async onModuleInit() {
    this.logger.log('🔄 Initializing Order-Inventory Event Handler...');

    // Subscribe to order lifecycle events (register handlers)
    await this.kafkaConsumer.subscribe('order.created', this.handleOrderCreated.bind(this));
    await this.kafkaConsumer.subscribe('order.updated', this.handleOrderUpdated.bind(this));
    await this.kafkaConsumer.subscribe('order.cancelled', this.handleOrderCancelled.bind(this));
    await this.kafkaConsumer.subscribe('order.delivered', this.handleOrderDelivered.bind(this));
    await this.kafkaConsumer.subscribe('order.shipped', this.handleOrderShipped.bind(this));
    await this.kafkaConsumer.subscribe('order.paid', this.handleOrderPaid.bind(this));

    // Start consuming after all handlers are registered
    await this.kafkaConsumer.startConsuming();

    this.logger.log('✅ Order-Inventory Event Handler initialized successfully');
  }

  /**
   * Handle order.created event
   * Reserves stock for all items in the order
   *
   * Event payload example:
   * {
   *   orderId: '123',
   *   buyerId: 'user-456',
   *   items: [
   *     { sku: 'PROD-001', name: 'Product 1', quantity: 2, unitPrice: 100 },
   *     { sku: 'PROD-002', name: 'Product 2', quantity: 1, unitPrice: 200 }
   *   ],
   *   total: 400,
   *   status: 'pending'
   * }
   */
  private async handleOrderCreated(event: any): Promise<void> {
    try {
      const orderId = event.orderId || event._id;
      const items = event.items || [];

      if (!orderId || !items.length) {
        this.logger.warn(
          `⚠️ Invalid order.created event: missing orderId or items`,
          JSON.stringify(event)
        );
        return;
      }

      this.logger.log(
        `📥 Processing order.created event for order ${orderId} with ${items.length} items`
      );

      // Extract SKUs and quantities
      const itemsToReserve = items.map((item: any) => ({
        sku: item.sku,
        quantity: item.quantity || 1,
      }));

      // Reserve stock for all items in the order
      const result = await this.reserveStockUseCase.executeBatch(
        orderId,
        itemsToReserve
      );

      if (result.success) {
        this.logger.log(
          `✅ Successfully reserved stock for order ${orderId}`
        );
      } else {
        this.logger.error(
          `❌ Failed to reserve stock for order ${orderId}: ${result.message}`,
          { failedSku: result.failedSku }
        );

        // TODO: Emit order.inventory_reservation_failed event
        // This should trigger order service to mark order as failed or pending_stock
        // For now, we log the error and the order service should handle timeout
      }
    } catch (error: any) {
      this.logger.error(
        `❌ Error handling order.created event:`,
        error.stack
      );
      // Don't throw - we don't want to crash the consumer
      // The order will remain in pending state and can be retried
    }
  }

  /**
   * Handle order.updated event
   * Processes order status changes
   *
   * Event payload example:
   * {
   *   orderId: '123',
   *   status: 'delivered',
   *   buyerId: 'user-456',
   *   items: [...]  // included for delivered status
   * }
   */
  private async handleOrderUpdated(event: any): Promise<void> {
    try {
      const orderId = event.orderId || event._id;
      const status = event.status;

      if (!orderId || !status) {
        this.logger.warn(
          `⚠️ Invalid order.updated event: missing orderId or status`,
          JSON.stringify(event)
        );
        return;
      }

      this.logger.log(
        `📥 Processing order.updated event for order ${orderId}, status: ${status}`
      );

      // Handle different status transitions
      switch (status) {
        case 'delivered':
          await this.handleOrderDelivered(event);
          break;

        case 'cancelled':
          await this.handleOrderCancelled(event);
          break;

        case 'shipped':
          // Stock remains reserved - no action needed
          this.logger.debug(
            `Order ${orderId} shipped - stock remains reserved`
          );
          break;

        case 'paid':
          // Stock remains reserved - no action needed
          this.logger.debug(
            `Order ${orderId} paid - stock remains reserved`
          );
          break;

        case 'pending':
          // Initial state - stock should already be reserved
          this.logger.debug(
            `Order ${orderId} pending - stock should be reserved`
          );
          break;

        default:
          this.logger.warn(
            `⚠️ Unknown order status: ${status} for order ${orderId}`
          );
      }
    } catch (error: any) {
      this.logger.error(
        `❌ Error handling order.updated event:`,
        error.stack
      );
      // Don't throw - we don't want to crash the consumer
    }
  }

  /**
   * Handle order delivered status
   * Deducts stock and releases reservation
   */
  private async handleOrderDelivered(event: any): Promise<void> {
    try {
      const orderId = event.orderId || event._id;
      const items = event.items || [];

      if (!items.length) {
        this.logger.warn(
          `⚠️ Order ${orderId} delivered but no items provided`
        );
        return;
      }

      this.logger.log(
        `📦 Processing delivered order ${orderId} with ${items.length} items`
      );

      // Extract SKUs and quantities
      const itemsToDeduct = items.map((item: any) => ({
        sku: item.sku,
        quantity: item.quantity || 1,
      }));

      // Deduct stock for all items (reduces stock, reserved, and increments sold)
      const result = await this.deductStockUseCase.executeBatch(
        orderId,
        itemsToDeduct
      );

      if (result.success) {
        this.logger.log(
          `✅ Successfully deducted stock for delivered order ${orderId}`
        );
      } else {
        this.logger.error(
          `❌ Failed to deduct stock for order ${orderId}: ${result.message}`,
          { failedItems: result.failedItems }
        );

        // Partial deduction is acceptable - manual intervention may be needed
        // The failed items are logged and can be processed manually
      }
    } catch (error: any) {
      this.logger.error(
        `❌ Error handling order delivered:`,
        error.stack
      );
    }
  }

  /**
   * Handle order.cancelled event
   * Releases reserved stock back to available pool
   *
   * Event payload example:
   * {
   *   orderId: '123',
   *   status: 'cancelled',
   *   items: [...]
   * }
   */
  private async handleOrderCancelled(event: any): Promise<void> {
    try {
      const orderId = event.orderId || event._id;
      const items = event.items || [];

      if (!orderId) {
        this.logger.warn(
          `⚠️ Invalid order.cancelled event: missing orderId`,
          JSON.stringify(event)
        );
        return;
      }

      this.logger.log(
        `❌ Processing order cancellation for order ${orderId}`
      );

      // If items are not provided, we can't release stock
      // This should be handled by including items in the cancelled event
      if (!items.length) {
        this.logger.warn(
          `⚠️ Order ${orderId} cancelled but no items provided - cannot release stock`
        );
        return;
      }

      // Extract SKUs and quantities
      const itemsToRelease = items.map((item: any) => ({
        sku: item.sku,
        quantity: item.quantity || 1,
      }));

      // Release reserved stock for all items
      const result = await this.releaseReservedStockUseCase.executeBatch(
        orderId,
        itemsToRelease,
        'order_cancelled'
      );

      if (result.success) {
        this.logger.log(
          `✅ Successfully released reserved stock for cancelled order ${orderId}`
        );
      } else {
        this.logger.error(
          `❌ Failed to release reserved stock for order ${orderId}: ${result.message}`,
          { failedItems: result.failedItems }
        );

        // Partial release - some items may need manual intervention
      }
    } catch (error: any) {
      this.logger.error(
        `❌ Error handling order.cancelled event:`,
        error.stack
      );
      // Don't throw - we don't want to crash the consumer
    }
  }

  /**
   * Handle order.shipped event
   * Stock remains reserved - no action needed
   */
  private async handleOrderShipped(event: any): Promise<void> {
    try {
      const orderId = event.orderId || event._id;
      this.logger.debug(
        `📦 Order ${orderId} shipped - stock remains reserved`
      );
      // No inventory action needed - stock stays reserved until delivery
    } catch (error: any) {
      this.logger.error(
        `❌ Error handling order.shipped event:`,
        error.stack
      );
    }
  }

  /**
   * Handle order.paid event
   * Stock remains reserved - no action needed
   */
  private async handleOrderPaid(event: any): Promise<void> {
    try {
      const orderId = event.orderId || event._id;
      this.logger.debug(
        `💳 Order ${orderId} paid - stock remains reserved`
      );
      // No inventory action needed - stock stays reserved until delivery
    } catch (error: any) {
      this.logger.error(
        `❌ Error handling order.paid event:`,
        error.stack
      );
    }
  }

  /**
   * Health check method for monitoring
   */
  getHandlerStatus(): {
    isHealthy: boolean;
    subscribedTopics: string[];
  } {
    return {
      isHealthy: true,
      subscribedTopics: [
        'order.created',
        'order.updated',
        'order.cancelled',
        'order.delivered',
        'order.shipped',
        'order.paid',
      ],
    };
  }
}
