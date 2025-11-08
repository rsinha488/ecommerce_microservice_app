import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  ProductRepositoryInterface,
} from '../../domain/interfaces/product-repository.interface';
import { ProductMapper } from '../../infrastructure/mappers/product.mapper';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryInterface,

    private readonly mapper: ProductMapper,
  ) {}

  async execute(productId: string) {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    return this.mapper.toResponse(product);
  }
}
