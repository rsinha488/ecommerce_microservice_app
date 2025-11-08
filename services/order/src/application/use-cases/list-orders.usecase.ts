import { Inject, Injectable } from '@nestjs/common';
import { ORDER_REPOSITORY, OrderRepositoryInterface } from '../../domain/interfaces/order-repository.interface';

@Injectable()
export class ListOrdersUseCase {
  constructor(

    @Inject(ORDER_REPOSITORY)
    private readonly repo: OrderRepositoryInterface) { }

  async execute(filter: any = {}) {
    return this.repo.findAll(filter);
  }
}
