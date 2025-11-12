import { Inject, Injectable } from '@nestjs/common';
import { ORDER_REPOSITORY, OrderRepositoryInterface } from '../../domain/interfaces/order-repository.interface';
import { OrderMapper } from '../../infrastructure/mappers/order.mapper';

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly repo: OrderRepositoryInterface,
    private readonly mapper: OrderMapper,
  ) {}

  async execute(filter: any = {}) {
    const orders = await this.repo.findAll(filter);
    // Map all orders to response format
    return orders.map((order) => this.mapper.toResponse(order));
  }
}
