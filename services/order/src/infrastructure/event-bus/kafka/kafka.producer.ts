import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { KafkaConfig } from './kafka.config';

@Injectable()
export class KafkaProducer implements OnModuleInit {
  private logger = new Logger(KafkaProducer.name);
  private producer: Producer;

  constructor(private readonly config: KafkaConfig) {}

  async onModuleInit() {
    const kafka = new Kafka({
      brokers: this.config.getBrokers(),
      clientId: 'order-service',
    });

    this.producer = kafka.producer();

    await this.producer.connect();
    this.logger.log('✅ Kafka Producer connected');
  }

  async emit(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });

      this.logger.log(`✅ Event emitted → ${topic}`);
    } catch (error) {
      this.logger.error(`❌ Error emitting to Kafka topic ${topic}`, error);
      throw new Error('Kafka emit failed');
    }
  }
}
