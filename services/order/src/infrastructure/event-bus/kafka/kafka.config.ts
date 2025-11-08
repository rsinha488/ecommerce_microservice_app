import { Injectable } from '@nestjs/common';

@Injectable()
export class KafkaConfig {
  getBrokers(): string[] {
    const brokers = process.env.KAFKA_BROKERS;

    if (!brokers) {
      throw new Error('❌ KAFKA_BROKERS missing in .env');
    }

    return brokers.split(',');
  }

  getGroupId(): string {
    return process.env.KAFKA_GROUP_ID || 'order-service-group';
  }
}
