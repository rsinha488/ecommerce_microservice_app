// src/infrastructure/events/product.producer.ts

import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class ProductProducer {
  private readonly producer: Producer;
  private readonly logger = new Logger(ProductProducer.name);

  constructor() {
    const kafka = new Kafka({
      clientId: 'product-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    // ✅ Initialize Kafka Producer
    this.producer = kafka.producer();
    this.init();
  }

  /**
   * ✅ Connect Kafka Producer on service startup
   */
  async init() {
    try {
      await this.producer.connect();
      this.logger.log('✅ Kafka Producer connected successfully');
    } catch (err) {
      this.logger.error('❌ Kafka Producer connection failed', err);
    }
  }

  /**
   * ✅ Reusable emit method (used for all product events)
   */
  private async emit(topic: string, payload: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(payload) }],
      });

      this.logger.log(`📤 Event emitted → [${topic}] | payload=${JSON.stringify(payload)}`);
    } catch (err) {
      this.logger.error(`❌ Failed to emit event on topic "${topic}"`, err);
      throw err;
    }
  }

  /**
   * ✅ Emit `product.created` event
   */
  async emitProductCreatedEvent(product: any) {
    console.log('Emitting product.created event for product:', JSON.stringify(product));
    const payload = {
      event: 'product.created',
      productId: product.id,
      sku: product.sku,
      initialStock: product.initialStock,
      timestamp: new Date().toISOString(),
    };

    return this.emit('product.events', payload);
  }

  /**
   * ✅ Emit `product.updated` event
   */
  async emitProductUpdatedEvent(product: any) {
    const payload = {
      event: 'product.updated',
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      stock: product.stock,
      updatedAt: new Date().toISOString(),
    };

    return this.emit('product.events', payload);
  }
}
