import { Injectable } from '@nestjs/common';
import { Order, OrderItem } from '../entities/order.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderFactory {
  createFrom(dto: { buyerId: string; items: { sku: string; name: string; unitPrice: number; quantity: number }[], currency?: string }): Order {
    const id = uuidv4();
    const items = dto.items.map(i => new OrderItem(i.sku, i.name, i.unitPrice, i.quantity));
    const total = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    const order = new Order(id, dto.buyerId, items, total, dto.currency || 'USD', 'pending', new Date(), new Date());
    return order;
  }
}
