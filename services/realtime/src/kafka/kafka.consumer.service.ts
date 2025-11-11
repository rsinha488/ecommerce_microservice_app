import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

/**
 * Kafka Consumer Service
 *
 * Manages Kafka consumer connections and message processing.
 * Implements event-driven architecture for real-time updates.
 *
 * @author E-commerce Platform
 * @version 1.0.0
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private messageHandlers: Map<string, (payload: any) => Promise<void>> =
    new Map();

  constructor() {
    // Initialize Kafka client
    this.kafka = new Kafka({
      clientId: 'realtime-service',
      brokers: [
        process.env.KAFKA_BROKER || 'kafka:29092',
      ],
      retry: {
        initialRetryTime: 300,
        retries: 10,
      },
    });

    // Create consumer
    this.consumer = this.kafka.consumer({
      groupId: 'realtime-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  /**
   * Initialize Kafka consumer on module startup
   */
  async onModuleInit() {
    try {
      await this.consumer.connect();
      this.logger.log('✅ Kafka consumer connected successfully');

      // Subscribe to topics
      await this.consumer.subscribe({
        topics: [
          'order.created',
          'order.updated',
          'order.cancelled',
          'inventory.updated',
          'product.created',
          'product.updated',
        ],
        fromBeginning: false,
      });

      this.logger.log('📡 Subscribed to Kafka topics');

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.logger.log('🔄 Kafka consumer is running');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Kafka consumer:', error);
      throw error;
    }
  }

  /**
   * Cleanup on module shutdown
   */
  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
      this.logger.log('👋 Kafka consumer disconnected');
    } catch (error) {
      this.logger.error('❌ Error disconnecting Kafka consumer:', error);
    }
  }

  /**
   * Register a message handler for a specific topic
   *
   * @param topic - Kafka topic name
   * @param handler - Async function to handle the message
   */
  registerHandler(
    topic: string,
    handler: (payload: any) => Promise<void>,
  ): void {
    this.messageHandlers.set(topic, handler);
    this.logger.log(`✅ Registered handler for topic: ${topic}`);
  }

  /**
   * Handle incoming Kafka messages
   *
   * @param payload - Kafka message payload
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      // Parse message value
      const messageValue = message.value?.toString();
      if (!messageValue) {
        this.logger.warn(`⚠️ Empty message received from topic: ${topic}`);
        return;
      }

      const data = JSON.parse(messageValue);

      this.logger.debug(
        `📨 Message received - Topic: ${topic}, Partition: ${partition}, Offset: ${message.offset}`,
      );

      // Get handler for this topic
      const handler = this.messageHandlers.get(topic);

      if (handler) {
        await handler(data);
        this.logger.debug(`✅ Message processed successfully - Topic: ${topic}`);
      } else {
        this.logger.warn(
          `⚠️ No handler registered for topic: ${topic}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error processing message from topic ${topic}:`,
        error,
      );
      // In production, you might want to send to a dead letter queue
    }
  }

  /**
   * Get consumer metrics
   */
  getMetrics() {
    return {
      registeredHandlers: this.messageHandlers.size,
      topics: Array.from(this.messageHandlers.keys()),
    };
  }
}
