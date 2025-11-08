import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaConsumer } from '../event-bus/kafka/kafka.consumer';

@Injectable()
export class OrderEventHandler implements OnModuleInit {
  private logger = new Logger(OrderEventHandler.name);

  constructor(private readonly consumer: KafkaConsumer) {}

  async onModuleInit() {
    await this.consumer.subscribe('inventory.updated', async (data) => {
      this.logger.log(`📥 Received inventory.updated → ${JSON.stringify(data)}`);

      // TODO: Add logic (update order, notify user, etc.)
    });
  }
}
