import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ORDER_REPOSITORY, OrderRepositoryInterface } from '../../domain/interfaces/order-repository.interface';

@Injectable()
export class GetOrderUseCase {
  constructor(

    @Inject(ORDER_REPOSITORY)
    private readonly repo: OrderRepositoryInterface) { }

  async execute(id: string) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
