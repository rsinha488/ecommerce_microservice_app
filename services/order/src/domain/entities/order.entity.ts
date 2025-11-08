export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'shipped' | 'delivered';

export class OrderItem {
  constructor(
    public readonly sku: string,
    public readonly name: string,
    public readonly unitPrice: number,
    public readonly quantity: number,
  ) {}
}

export class Order {
  constructor(
    public readonly id: string,
    public buyerId: string,
    public items: OrderItem[],
    public total: number,
    public currency: string,
    public status: OrderStatus,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}
