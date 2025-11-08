import { Injectable } from '@nestjs/common';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrderDomainService {
  validateOrder(order: Order) {
    if (!order.items || order.items.length === 0) throw new Error('Order must have items');
    if (order.total < 0) throw new Error('Order total invalid');
  }

  calculateTotal(items: { unitPrice: number; quantity: number }[]) {
    return items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  }
}
