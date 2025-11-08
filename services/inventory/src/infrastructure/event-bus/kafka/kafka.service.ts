import { Injectable, Logger } from '@nestjs/common';
import { KafkaProducer } from './kafka.producer';

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private readonly MAX_PAYLOAD = 256 * 1024; // 256KB cap

  constructor(private readonly producer: KafkaProducer) {}

  async emit(topic: string, payload: any): Promise<void> {
    try {
      const str = JSON.stringify(payload || {});
      if (str.length > this.MAX_PAYLOAD) {
        throw new Error(`Payload too large: ${str.length} bytes (max ${this.MAX_PAYLOAD})`);
      }
      this.logger.debug(`📤 EventBus: emitting ${topic} size=${str.length}B`);
      await this.producer.emit(topic, payload);
      this.logger.log(`✅ EventBus emitted ${topic}`);
    } catch (err) {
      this.logger.error(`❌ EventBus emit failed for ${topic}`, err);
      throw err;
    }
  }
}
