import { Injectable } from '@nestjs/common';
import { Order } from '../../domain/entities/order.entity';

@Injectable()
export class OrderMapper {
  toDomain(raw: any): Order | null {
    if (!raw) return null;
    return new Order(
      raw.orderId ?? raw._id?.toString() ?? raw.id,
      raw.buyerId ?? raw.userId,
      raw.items ?? [],
      raw.subtotal ?? 0,
      raw.tax ?? 0,
      raw.total ?? 0,
      raw.currency ?? 'USD',
      raw.status ?? 'pending',
      raw.shippingAddress,
      raw.createdAt ? new Date(raw.createdAt) : new Date(),
      raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
    );
  }

  toPersistence(order: Order) {
    return {
      orderId: order.id,
      buyerId: order.buyerId,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      currency: order.currency,
      status: order.status,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  toResponse(order: Order) {
    return {
      id: order.id,
      _id: order.id, // Frontend expects _id
      userId: order.buyerId, // Frontend expects userId
      buyerId: order.buyerId,
      items: order.items || [],
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      currency: order.currency,
      status: order.status,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
