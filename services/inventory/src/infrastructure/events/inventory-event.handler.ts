import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';

import { CreateItemUseCase } from '../../application/use-cases/create-item.usecase';
import { InventoryRepository } from '../repositories/inventory.repository';

@Injectable()
export class InventoryEventHandler {
  private readonly logger = new Logger(InventoryEventHandler.name);
  private readonly consumer: Consumer;

  constructor(
    private readonly createInventory: CreateItemUseCase,
    private readonly repo: InventoryRepository,
  ) {
    const kafka = new Kafka({
      clientId: 'inventory-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      retry: {
        retries: 5,
        initialRetryTime: 300,
      },
    });

    this.consumer = kafka.consumer({ groupId: 'inventory-group' });

    this.initialize().catch((err) =>
      this.logger.error('❌ Kafka initialization failed', err),
    );
  }

  private async initialize() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: 'product.events',
      fromBeginning: false,
    });

    this.logger.log('✅ Kafka Consumer connected → product.events');

    await this.consumer.run({
      autoCommit: true,
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;

        let event: any;
        try {
          event = JSON.parse(message.value.toString());
        } catch (e) {
          this.logger.error('❌ Invalid JSON received. Skipping message.');
          return;
        }

        this.logger.log(
          `📥 Event received: ${event.event} | SKU=${event.sku}`,
        );

        try {
          switch (event.event) {
            case 'product.created':
              await this.handleProductCreated(event);
              break;

            case 'product.updated':
              await this.handleProductUpdated(event);
              break;

            default:
              this.logger.warn(`⚠️ Unknown event type: ${event.event}`);
          }
        } catch (err) {
          this.logger.error(
            `❌ Error processing event ${event.event} (SKU=${event.sku})`,
            err.message,
          );
        }
      },
    });
  }

  /**
   * ✅ Handle product.created event → Create initial inventory record
   */
  private async handleProductCreated(event: any) {
    try {
      console.log(` event: ${JSON.stringify(event)}`);
      await this.createInventory.execute({
        sku: event.sku,
        stock: event.initialStock ,
        location: event.location || 'default',
      });

      this.logger.log(
        `✅ Inventory created for SKU=${event.sku} | stock=${event.initialStock }`,
      );
    } catch (err) {
      this.logger.error(
        `❌ Failed to create inventory for SKU=${event.sku}`,
        err.message,
      );
    }
  }

  /**
   * ✅ Handle product.updated event → Update inventory fields
   */
  private async handleProductUpdated(event: any) {
    try {
      const existing = await this.repo.findBySku(event.sku);

      if (!existing) {
        this.logger.warn(`⚠️ Inventory not found for SKU=${event.sku}`);
        return;
      }
      // ✅ Update only passed fields — safely handles 0, undefined, null
      const updateFields: any = {};

      if (typeof event.stock === 'number') {
        updateFields.stock = event.stock;   // stock is valid number → update
      }

      if (Object.keys(updateFields).length > 0) {
        await this.repo.updateFields(event.sku, updateFields);
        this.logger.log(`✅ Inventory updated for SKU=${event.sku}`);
      } else {
        this.logger.log(
          `ℹ️ Product updated event received but no inventory fields changed`,
        );
      }
    } catch (err) {
      this.logger.error(
        `❌ Failed updating inventory for SKU=${event.sku}`,
        err.message,
      );
    }
  }
}
