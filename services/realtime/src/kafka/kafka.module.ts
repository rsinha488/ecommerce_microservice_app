import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './kafka.consumer.service';
import { OrderEventsConsumer } from './order-events.consumer';
import { InventoryEventsConsumer } from './inventory-events.consumer';
import { RealtimeModule } from '../realtime/realtime.module';

/**
 * Kafka Module
 *
 * Manages Kafka consumer services and event handlers.
 * Coordinates event-driven communication with other microservices.
 */
@Module({
  imports: [RealtimeModule],
  providers: [
    KafkaConsumerService,
    OrderEventsConsumer,
    InventoryEventsConsumer,
  ],
  exports: [KafkaConsumerService],
})
export class KafkaModule {}
