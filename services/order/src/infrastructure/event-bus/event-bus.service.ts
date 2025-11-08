import { Injectable, Logger } from '@nestjs/common';
import { KafkaProducer } from './kafka/kafka.producer';

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  // Optional: Prevent crashing if huge payload is sent accidentally
  private readonly MAX_PAYLOAD_SIZE = 200 * 1024; // 200 KB

  constructor(private readonly producer: KafkaProducer) {}

  async emit(event: string, payload: any): Promise<void> {
    const start = Date.now();

    try {
      // ✅ Validate payload safety
      const serialized = JSON.stringify(payload);
      if (serialized.length > this.MAX_PAYLOAD_SIZE) {
        this.logger.error(
          `❌ Payload too large for event '${event}' → Size: ${serialized.length} bytes`,
        );
        throw new Error('Payload exceeds maximum allowed Kafka size');
      }

      // ✅ Log event publish attempt
      this.logger.log(
        `📤 Emitting Kafka event '${event}' | size=${serialized.length}B`,
      );

      // ✅ Publish event
      await this.producer.emit(event, payload);

      // ✅ Success log with execution time
      this.logger.log(
        `✅ Event emitted: '${event}' in ${Date.now() - start}ms`,
      );
    } catch (error) {
      // ✅ Production-safe error serialization
      this.logger.error(
        `❌ EventBus emit failed → '${event}'`,
        error instanceof Error ? error.stack : JSON.stringify(error),
      );

      throw error;
    }
  }
}
