import { Inject, Injectable } from '@nestjs/common';
import { OrderFactory } from '../../domain/factories/order.factory';
import { ORDER_REPOSITORY, OrderRepositoryInterface } from '../../domain/interfaces/order-repository.interface';
import { OrderDomainService } from '../../domain/services/order-domain.service';
import { OrderProducer } from '../../infrastructure/events/order.producer';
import { CreateOrderDto } from '../dto/create-order.dto';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly factory: OrderFactory,

    @Inject(ORDER_REPOSITORY)
    private readonly repo: OrderRepositoryInterface,

    private readonly domain: OrderDomainService,
    private readonly producer: OrderProducer,
  ) {}

  async execute(dto: CreateOrderDto) {
    const order = this.factory.createFrom({
      buyerId: dto.buyerId,
      items: dto.items,
      currency: dto.currency,
    });

    this.domain.validateOrder(order);

    const saved = await this.repo.create(order);

    await this.producer.orderCreated(saved);

    return saved;
  }
}
