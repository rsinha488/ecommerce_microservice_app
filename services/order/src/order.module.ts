import { Module } from '@nestjs/common';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';
import { KafkaModule } from './infrastructure/event-bus/kafka/kafka.module';
import { OrderProducer } from './infrastructure/events/order.producer';
import { OrderEventHandler } from './infrastructure/events/order-event.handler';

@Module({
  imports: [EventBusModule, KafkaModule],
  providers: [OrderProducer, OrderEventHandler],
  exports: [OrderProducer],
})
export class OrderModule {}
