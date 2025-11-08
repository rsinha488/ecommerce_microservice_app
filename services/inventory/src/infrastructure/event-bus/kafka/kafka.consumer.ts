import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { KafkaConfig } from './kafka.config';

type Handler = (payload: any) => Promise<void> | void;

@Injectable()
export class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumer.name);
  private consumer: Consumer;
  private handlers = new Map<string, Handler>();

  constructor(private readonly cfg: KafkaConfig) {}

  async onModuleInit(): Promise<void> {
    const kafka = new Kafka({
      clientId: this.cfg.getClientId() + '-consumer',
      brokers: this.cfg.getBrokers(),
      retry: this.cfg.getRetryOptions(),
    });

    this.consumer = kafka.consumer({ groupId: this.cfg.getGroupId() });
    try {
      await this.consumer.connect();
      this.logger.log('✅ Kafka Consumer connected');
    } catch (err) {
      this.logger.error('❌ Kafka Consumer connection failed', err);
      throw err;
    }
  }

  async subscribe(topic: string, handler: Handler): Promise<void> {
    if (!this.consumer) {
      throw new Error('Kafka consumer not initialized');
    }

    if (this.handlers.has(topic)) {
      this.logger.warn(`Subscription already exists for topic=${topic}, skipping duplicate subscribe`);
      return;
    }

    await this.consumer.subscribe({ topic, fromBeginning: false });
    this.handlers.set(topic, handler);

    await this.consumer.run({
      eachMessage: async ({ message, partition }) => {
        if (!message.value) {
          this.logger.warn(`⚠️ Empty message on topic=${topic} partition=${partition} — skipping`);
          return;
        }

        let payload: any;
        const raw = message.value.toString();

        try {
          payload = JSON.parse(raw);
        } catch (err) {
          this.logger.error(`❌ Kafka message JSON parse error on topic=${topic}`, { raw, err: err.message });
          return;
        }

        try {
          await handler(payload);
        } catch (err) {
          this.logger.error(`❌ Handler error for topic=${topic}`, err);
          // do not throw to avoid stopping the consumer loop; consider DLQ/outbox pattern here
        }
      },
    });

    this.logger.log(`✅ Subscribed handler to topic=${topic}`);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.consumer.disconnect();
      this.logger.log('🛑 Kafka Consumer disconnected');
    } catch (err) {
      this.logger.error('❌ Error while disconnecting Kafka consumer', err);
    }
  }
}
