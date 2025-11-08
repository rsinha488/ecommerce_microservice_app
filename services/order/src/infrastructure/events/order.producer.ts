import { Injectable } from '@nestjs/common';
import { EventBusService } from '../event-bus/event-bus.service';
import { Order } from '../../domain/entities/order.entity';

@Injectable()
export class OrderProducer {
  constructor(private readonly bus: EventBusService) {}

  async orderCreated(order: Order) {
    await this.bus.emit('order.created', {
      orderId: order.id,
      total: order.total,
      buyerId: order.buyerId,
      items: order.items,
    });
  }

  async orderUpdated(order: Order) {
    await this.bus.emit('order.updated', {
      orderId: order.id,
      status: order.status,
    });
  }
}
