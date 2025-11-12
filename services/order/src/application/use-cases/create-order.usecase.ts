import { Inject, Injectable } from '@nestjs/common';
import { OrderFactory } from '../../domain/factories/order.factory';
import { ORDER_REPOSITORY, OrderRepositoryInterface } from '../../domain/interfaces/order-repository.interface';
import { OrderDomainService } from '../../domain/services/order-domain.service';
import { OrderProducer } from '../../infrastructure/events/order.producer';
import { OrderMapper } from '../../infrastructure/mappers/order.mapper';
import { CreateOrderDto } from '../dto/create-order.dto';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly factory: OrderFactory,

    @Inject(ORDER_REPOSITORY)
    private readonly repo: OrderRepositoryInterface,

    private readonly domain: OrderDomainService,
    private readonly producer: OrderProducer,
    private readonly mapper: OrderMapper,
  ) {}

  async execute(dto: CreateOrderDto) {
    const order = this.factory.createFrom({
      buyerId: dto.buyerId,
      items: dto.items,
      currency: dto.currency,
      shippingAddress: dto.shippingAddress,
      tax: dto.tax, // Pass tax from frontend if provided
    });

    this.domain.validateOrder(order);

    const saved = await this.repo.create(order);

    await this.producer.orderCreated(saved);

    // Return mapped response with proper field names
    return this.mapper.toResponse(saved);
  }
}
