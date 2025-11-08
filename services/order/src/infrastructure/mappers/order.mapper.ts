import { Injectable } from '@nestjs/common';
import { Order } from '../../domain/entities/order.entity';

@Injectable()
export class OrderMapper {
  toDomain(raw: any): Order | null {
    if (!raw) return null;
    return new Order(
      raw.orderId ?? raw._id?.toString(),
      raw.buyerId,
      raw.items,
      raw.total,
      raw.currency,
      raw.status,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  toPersistence(order: Order) {
    return {
      orderId: order.id,
      buyerId: order.buyerId,
      items: order.items,
      total: order.total,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  toResponse(order: Order) {
    return {
      id: order.id,
      buyerId: order.buyerId,
      items: order.items,
      total: order.total,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
