import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from './kafka.consumer.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * Inventory Events Consumer
 *
 * Listens to inventory-related Kafka events and broadcasts them via WebSocket.
 * Enables real-time stock level updates for users and admins.
 *
 * Events handled:
 * - inventory.updated - Stock levels changed
 * - product.created - New product added
 * - product.updated - Product details changed
 *
 * @author E-commerce Platform
 * @version 1.0.0
 */
@Injectable()
export class InventoryEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(InventoryEventsConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly gateway: RealtimeGateway,
  ) {}

  /**
   * Register event handlers on module initialization
   */
  async onModuleInit() {
    this.logger.log('🔄 Initializing inventory event handlers...');

    // Register handler for inventory.updated
    this.kafkaConsumer.registerHandler(
      'inventory.updated',
      this.handleInventoryUpdated.bind(this),
    );

    // Register handler for product.created
    this.kafkaConsumer.registerHandler(
      'product.created',
      this.handleProductCreated.bind(this),
    );

    // Register handler for product.updated
    this.kafkaConsumer.registerHandler(
      'product.updated',
      this.handleProductUpdated.bind(this),
    );

    this.logger.log('✅ Inventory event handlers registered');
  }

  /**
   * Handle inventory.updated event
   *
   * Triggered when product stock levels change.
   * Broadcasts update to all subscribed clients.
   *
   * @param payload - Inventory update event data
   */
  private async handleInventoryUpdated(payload: any): Promise<void> {
    try {
      this.logger.log(
        `📊 Inventory updated event - ProductID: ${payload.productId}, Stock: ${payload.stock}`,
      );

      // Broadcast to all subscribed clients
      this.gateway.sendInventoryUpdate({
        productId: payload.productId,
        stock: payload.stock,
        previousStock: payload.previousStock,
        sku: payload.sku,
        productName: payload.productName,
        isLowStock: payload.stock < 10,
        isOutOfStock: payload.stock === 0,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      });

      // Alert admins if stock is low or out
      if (payload.stock < 10) {
        const alertMessage =
          payload.stock === 0
            ? `Product ${payload.productName || payload.sku} is OUT OF STOCK`
            : `Product ${payload.productName || payload.sku} is LOW IN STOCK (${payload.stock} remaining)`;

        this.gateway.broadcastToAdmins('admin:alert', {
          type: 'inventory',
          severity: payload.stock === 0 ? 'critical' : 'warning',
          message: alertMessage,
          productId: payload.productId,
          stock: payload.stock,
        });
      }

      this.logger.log(
        `✅ Inventory update broadcast for product ${payload.productId}`,
      );
    } catch (error) {
      this.logger.error('❌ Error handling inventory.updated event:', error);
    }
  }

  /**
   * Handle product.created event
   *
   * Triggered when a new product is added to the catalog.
   * Notifies admin dashboard.
   *
   * @param payload - Product creation event data
   */
  private async handleProductCreated(payload: any): Promise<void> {
    try {
      this.logger.log(
        `✨ Product created event - ProductID: ${payload._id || payload.productId}`,
      );

      // Notify admin dashboard
      this.gateway.broadcastToAdmins('admin:product:created', {
        productId: payload._id || payload.productId,
        name: payload.name,
        sku: payload.sku,
        category: payload.category,
        price: payload.price,
        stock: payload.stock,
        createdAt: payload.createdAt || new Date().toISOString(),
      });

      this.logger.log(
        `✅ Product creation broadcast to admins - ${payload.name}`,
      );
    } catch (error) {
      this.logger.error('❌ Error handling product.created event:', error);
    }
  }

  /**
   * Handle product.updated event
   *
   * Triggered when product details are modified.
   * Notifies admin dashboard and updates product pages.
   *
   * @param payload - Product update event data
   */
  private async handleProductUpdated(payload: any): Promise<void> {
    try {
      this.logger.log(
        `📝 Product updated event - ProductID: ${payload._id || payload.productId}`,
      );

      // Notify admin dashboard
      this.gateway.broadcastToAdmins('admin:product:updated', {
        productId: payload._id || payload.productId,
        name: payload.name,
        changes: payload.changes || {},
        updatedAt: payload.updatedAt || new Date().toISOString(),
      });

      // Broadcast to all users viewing products (optional)
      this.gateway.broadcastToAll('product:updated', {
        productId: payload._id || payload.productId,
        name: payload.name,
        price: payload.price,
        stock: payload.stock,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      });

      this.logger.log(
        `✅ Product update broadcast - ${payload.name}`,
      );
    } catch (error) {
      this.logger.error('❌ Error handling product.updated event:', error);
    }
  }
}
