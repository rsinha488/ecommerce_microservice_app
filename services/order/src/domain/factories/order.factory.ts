import { Injectable } from '@nestjs/common';
import { Order, OrderItem, ShippingAddress } from '../entities/order.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class OrderFactory {
  createFrom(dto: {
    buyerId: string;
    items: { sku: string; name: string; unitPrice: number; quantity: number }[],
    currency?: string,
    shippingAddress?: ShippingAddress,
    tax?: number
  }): Order {
    const id = randomUUID();
    const items = dto.items.map(i => new OrderItem(i.sku, i.name, i.unitPrice, i.quantity));
    const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);

    // Calculate tax - use provided tax or calculate 10% if not provided
    const TAX_RATE = 0.10;
    const tax = dto.tax !== undefined ? dto.tax : subtotal * TAX_RATE;
    const total = subtotal + tax;

    const order = new Order(
      id,
      dto.buyerId,
      items,
      subtotal,
      tax,
      total,
      dto.currency || 'USD',
      'pending',
      dto.shippingAddress,
      new Date(),
      new Date()
    );
    return order;
  }
}
