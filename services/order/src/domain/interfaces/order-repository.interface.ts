import { Order } from '../entities/order.entity';
export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';
export interface OrderRepositoryInterface {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findAll(filter?: any): Promise<Order[]>;
  updateStatus(id: string, status: string): Promise<Order | null>;
}
    