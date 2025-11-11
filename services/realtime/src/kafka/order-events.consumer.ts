import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from './kafka.consumer.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * Order Events Consumer
 *
 * Listens to order-related Kafka events and broadcasts them via WebSocket.
 * Implements event-driven order status updates.
 *
 * Events handled:
 * - order.created - New order placed
 * - order.updated - Order status changed
 * - order.cancelled - Order cancelled
 *
 * @author E-commerce Platform
 * @version 1.0.0
 */
@Injectable()
export class OrderEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderEventsConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly gateway: RealtimeGateway,
  ) {}

  /**
   * Register event handlers on module initialization
   */
  async onModuleInit() {
    this.logger.log('🔄 Initializing order event handlers...');

    // Register handler for order.created
    this.kafkaConsumer.registerHandler(
      'order.created',
      this.handleOrderCreated.bind(this),
    );

    // Register handler for order.updated
    this.kafkaConsumer.registerHandler(
      'order.updated',
      this.handleOrderUpdated.bind(this),
    );

    // Register handler for order.cancelled
    this.kafkaConsumer.registerHandler(
      'order.cancelled',
      this.handleOrderCancelled.bind(this),
    );

    this.logger.log('✅ Order event handlers registered');
  }

  /**
   * Handle order.created event
   *
   * Triggered when a new order is placed.
   * Sends real-time notification to the buyer.
   *
   * @param payload - Order creation event data
   */
  private async handleOrderCreated(payload: any): Promise<void> {
    try {
      this.logger.log(
        `📦 Order created event received - OrderID: ${payload.orderId || payload._id}`,
      );

      const userId = payload.buyerId || payload.userId;

      if (!userId) {
        this.logger.warn('⚠️ Order created event missing buyerId/userId');
        return;
      }

      // Broadcast to user via WebSocket
      this.gateway.sendOrderCreated(userId, {
        orderId: payload.orderId || payload._id,
        status: payload.status || 'pending',
        totalAmount: payload.totalAmount || payload.total,
        items: payload.items || [],
        createdAt: payload.createdAt || new Date().toISOString(),
        message: 'Your order has been placed successfully!',
      });

      // Send notification
      this.gateway.sendNotification(userId, {
        type: 'order',
        title: 'Order Placed',
        message: `Order #${payload.orderId || payload._id} has been placed successfully`,
        orderId: payload.orderId || payload._id,
        priority: 'normal',
      });

      this.logger.log(`✅ Order created notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('❌ Error handling order.created event:', error);
    }
  }

  /**
   * Handle order.updated event
   *
   * Triggered when order status changes (e.g., processing -> shipped).
   * Sends real-time update to the buyer.
   *
   * @param payload - Order update event data
   */
  private async handleOrderUpdated(payload: any): Promise<void> {
    try {
      this.logger.log(
        `📦 Order updated event received - OrderID: ${payload.orderId || payload._id}, Status: ${payload.status}`,
      );

      const userId = payload.buyerId || payload.userId;

      if (!userId) {
        this.logger.warn('⚠️ Order updated event missing buyerId/userId');
        return;
      }

      // Broadcast to user via WebSocket
      this.gateway.sendOrderUpdated(userId, {
        orderId: payload.orderId || payload._id,
        status: payload.status,
        previousStatus: payload.previousStatus,
        updatedAt: payload.updatedAt || new Date().toISOString(),
        message: this.getStatusMessage(payload.status),
      });

      // Send notification for important status changes
      if (this.isImportantStatus(payload.status)) {
        this.gateway.sendNotification(userId, {
          type: 'order',
          title: 'Order Status Updated',
          message: `Order #${payload.orderId || payload._id} is now ${payload.status}`,
          orderId: payload.orderId || payload._id,
          status: payload.status,
          priority: 'high',
        });
      }

      this.logger.log(`✅ Order update notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('❌ Error handling order.updated event:', error);
    }
  }

  /**
   * Handle order.cancelled event
   *
   * Triggered when an order is cancelled.
   * Sends real-time notification to the buyer.
   *
   * @param payload - Order cancellation event data
   */
  private async handleOrderCancelled(payload: any): Promise<void> {
    try {
      this.logger.log(
        `❌ Order cancelled event received - OrderID: ${payload.orderId || payload._id}`,
      );

      const userId = payload.buyerId || payload.userId;

      if (!userId) {
        this.logger.warn('⚠️ Order cancelled event missing buyerId/userId');
        return;
      }

      // Broadcast to user via WebSocket
      this.gateway.sendOrderCancelled(userId, {
        orderId: payload.orderId || payload._id,
        reason: payload.reason || 'Order cancelled',
        refundAmount: payload.refundAmount,
        cancelledAt: payload.cancelledAt || new Date().toISOString(),
        message: 'Your order has been cancelled',
      });

      // Send notification
      this.gateway.sendNotification(userId, {
        type: 'order',
        title: 'Order Cancelled',
        message: `Order #${payload.orderId || payload._id} has been cancelled`,
        orderId: payload.orderId || payload._id,
        reason: payload.reason,
        priority: 'high',
      });

      this.logger.log(
        `✅ Order cancellation notification sent to user ${userId}`,
      );
    } catch (error) {
      this.logger.error('❌ Error handling order.cancelled event:', error);
    }
  }

  /**
   * Get user-friendly message for order status
   *
   * @param status - Order status
   * @returns User-friendly message
   */
  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      pending: 'Your order is pending confirmation',
      confirmed: 'Your order has been confirmed',
      processing: 'Your order is being processed',
      shipped: 'Your order has been shipped',
      delivered: 'Your order has been delivered',
      cancelled: 'Your order has been cancelled',
      refunded: 'Your order has been refunded',
    };

    return messages[status] || `Your order status is now ${status}`;
  }

  /**
   * Check if status change requires high-priority notification
   *
   * @param status - Order status
   * @returns true if status is important
   */
  private isImportantStatus(status: string): boolean {
    const importantStatuses = ['shipped', 'delivered', 'cancelled', 'refunded'];
    return importantStatuses.includes(status);
  }
}
