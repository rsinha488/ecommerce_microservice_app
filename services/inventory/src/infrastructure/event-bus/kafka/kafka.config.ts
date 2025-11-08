// production-ready Kafka config helper
import { Injectable } from '@nestjs/common';

@Injectable()
export class KafkaConfig {
  getBrokers(): string[] {
    const raw = process.env.KAFKA_BROKER || process.env.KAFKA_BROKER;
    if (!raw) {
      throw new Error('KAFKA_BROKER (or KAFKA_BROKER) env var is required');
    }
    return raw.split(',').map(s => s.trim());
  }

  getClientId(): string {
    return process.env.KAFKA_CLIENT_ID || 'inventory-service';
  }

  getGroupId(): string {
    return process.env.KAFKA_GROUP_ID || 'inventory-consumer-group';
  }

  getRetryOptions() {
    return {
      initialRetryTime: 300,
      retries: 5,
    };
  }
}
