import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../event-bus/event-bus.service';
import { Order } from '../../domain/entities/order.entity';

/**
 * ✅ Order Event Producer
 *
 * Publishes order lifecycle events to Kafka topics
 * These events are consumed by other microservices (Inventory, Realtime, Notification, etc.)
 *
 * Event Types:
 * - order.created: New order placed (triggers inventory reservation)
 * - order.updated: Order status changed
 * - order.cancelled: Order cancelled (triggers inventory release)
 * - order.delivered: Order delivered (triggers stock deduction)
 * - order.shipped: Order shipped
 * - order.paid: Payment completed
 *
 * @Injectable
 */
@Injectable()
export class OrderProducer {
  private readonly logger = new Logger(OrderProducer.name);

  constructor(private readonly bus: EventBusService) {}

  /**
   * Emit order created event
   * Triggers inventory reservation in inventory service
   */
  async orderCreated(order: Order): Promise<void> {
    try {
      await this.bus.emit('order.created', {
        event: 'order.created',
        orderId: order.id,
        buyerId: order.buyerId,
        items: order.items.map(item => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        currency: order.currency,
        status: order.status,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
      });

      this.logger.log(
        `📤 Order created event emitted for order ${order.id}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to emit order created event for order ${order.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Emit order updated event
   * Includes full order details for inventory operations
   */
  async orderUpdated(order: Order): Promise<void> {
    try {
      const payload: any = {
        event: 'order.updated',
        orderId: order.id,
        buyerId: order.buyerId,
        status: order.status,
        updatedAt: order.updatedAt?.toISOString() || new Date().toISOString(),
      };

      // Include items for statuses that require inventory operations
      if (['delivered', 'cancelled'].includes(order.status)) {
        payload.items = order.items.map(item => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));
      }

      await this.bus.emit('order.updated', payload);

      this.logger.log(
        `📤 Order updated event emitted for order ${order.id}, status: ${order.status}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to emit order updated event for order ${order.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Emit order cancelled event
   * Triggers inventory reservation release
   */
  async orderCancelled(order: Order): Promise<void> {
    try {
      await this.bus.emit('order.cancelled', {
        event: 'order.cancelled',
        orderId: order.id,
        buyerId: order.buyerId,
        items: order.items.map(item => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        total: order.total,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      });

      this.logger.log(
        `📤 Order cancelled event emitted for order ${order.id}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to emit order cancelled event for order ${order.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Emit order delivered event
   * Triggers stock deduction in inventory service
   */
  async orderDelivered(order: Order): Promise<void> {
    try {
      await this.bus.emit('order.delivered', {
        event: 'order.delivered',
        orderId: order.id,
        buyerId: order.buyerId,
        items: order.items.map(item => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        total: order.total,
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
      });

      this.logger.log(
        `📤 Order delivered event emitted for order ${order.id}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to emit order delivered event for order ${order.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Emit order shipped event
   */
  async orderShipped(order: Order): Promise<void> {
    try {
      await this.bus.emit('order.shipped', {
        event: 'order.shipped',
        orderId: order.id,
        buyerId: order.buyerId,
        status: 'shipped',
        shippedAt: new Date().toISOString(),
      });

      this.logger.log(
        `📤 Order shipped event emitted for order ${order.id}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to emit order shipped event for order ${order.id}:`,
        error
      );
      // Don't throw - shipping event is not critical
    }
  }

  /**
   * Emit order paid event
   */
  async orderPaid(order: Order): Promise<void> {
    try {
      await this.bus.emit('order.paid', {
        event: 'order.paid',
        orderId: order.id,
        buyerId: order.buyerId,
        total: order.total,
        status: 'paid',
        paidAt: new Date().toISOString(),
      });

      this.logger.log(
        `📤 Order paid event emitted for order ${order.id}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to emit order paid event for order ${order.id}:`,
        error
      );
      // Don't throw - payment event is not critical for inventory
    }
  }
}
