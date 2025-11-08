// src/application/use-cases/list-products.usecase.ts

import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  ProductRepositoryInterface,
} from '../../domain/interfaces/product-repository.interface';
import { FilterProductDto } from '../dto/filter-product.dto';
import { ProductDomainService } from '../../domain/services/product-domain.service';
import { ProductMapper } from '../../infrastructure/mappers/product.mapper';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryInterface,
    private readonly domainService: ProductDomainService,
    private readonly mapper: ProductMapper,
  ) {}

  async execute(filter: FilterProductDto) {
    try {
      // ✅ Step 1 — Validate filter rules (domain-level validation)
      this.domainService.validateListFilters(filter);

      // ✅ Step 2 — Query DB with pagination
      const products = await this.productRepository.findAll(filter);
      const total = await this.productRepository.count(filter);

      // ✅ Calculate pagination metadata
      const page = filter.page || 1;
      const limit = filter.limit || 10;
      const totalPages = Math.ceil(total / limit);

      // ✅ Step 3 — Map domain → response model
      return {
        products: products.map((product) => this.mapper.toResponse(product)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          code: 'PRODUCT_FILTER_ERROR',
          message: error.message || 'Failed to fetch filtered products',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
