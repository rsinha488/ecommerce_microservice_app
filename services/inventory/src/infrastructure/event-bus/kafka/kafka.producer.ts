import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { KafkaConfig } from './kafka.config';

@Injectable()
export class KafkaProducer implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducer.name);
  private producer: Producer;

  constructor(private readonly cfg: KafkaConfig) {}

  async onModuleInit(): Promise<void> {
    const kafka = new Kafka({
      clientId: this.cfg.getClientId(),
      brokers: this.cfg.getBrokers(),
      retry: this.cfg.getRetryOptions(),
    });

    this.producer = kafka.producer();
    try {
      await this.producer.connect();
      this.logger.log('✅ Kafka Producer connected');
    } catch (err) {
      this.logger.error('❌ Kafka Producer connection failed', err);
      throw err;
    }
  }

  async emit(topic: string, payload: any): Promise<void> {
    try {
      const value = JSON.stringify(payload);
      await this.producer.send({
        topic,
        messages: [{ value }],
      });

      this.logger.debug(`📤 Emitted ${topic} (size=${value.length}B)`);
    } catch (err) {
      this.logger.error(`❌ Failed to emit event to topic=${topic}`, err);
      throw err;
    }
  }
}
