// src/application/use-cases/update-product.usecase.ts

import { Injectable, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  ProductRepositoryInterface,
} from '../../domain/interfaces/product-repository.interface';

import { ProductDomainService } from '../../domain/services/product-domain.service';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductMapper } from '../../infrastructure/mappers/product.mapper';
import { ProductProducer } from '../../infrastructure/events/product.producer';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repository: ProductRepositoryInterface,

    private readonly domainService: ProductDomainService,
    private readonly mapper: ProductMapper,
    private readonly producer: ProductProducer,
  ) {}

  async execute(id: string, dto: UpdateProductDto) {
    try {
      // ✅ Step 1 — Ensure product exists
      const existing = await this.repository.findById(id);
      await this.domainService.ensureProductExists(existing, id);

      // ✅ Step 2 — Update product
      const updated = await this.repository.update(id, dto);

      if (!updated) {
        throw new NotFoundException(`❌ Product with id ${id} not found for update`);
      }

      // ✅ Step 3 — Convert DB document → Domain entity
      const productEntity = this.mapper.toEntity(updated);

      if (!productEntity) {
        throw new InternalServerErrorException('❌ Mapper failed: Cannot convert updated product to domain entity');
      }

      // ✅ Step 4 — Domain validation
      this.domainService.validateProduct(productEntity);

      console.log('✅ Product updated successfully:', productEntity);
      // ✅ Step 5 — Emit Kafka Event
      try {
        await this.producer.emitProductUpdatedEvent(productEntity);
      } catch (err) {
        console.error('❌ Kafka event emit failed (product.updated):', err);
        // ❗ Do NOT stop update API response — event failure shouldn't break request.
      }

      // ✅ Step 6 — Response
      return this.mapper.toResponse(productEntity);
    } catch (error) {
      console.error(`❌ Error updating product ${id}:`, error);
      throw error;
    }
  }
}