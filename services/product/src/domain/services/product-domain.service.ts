// src/domain/services/product-domain.service.ts

import { FilterProductDto } from '../../application/dto/filter-product.dto';
import { Product } from '../entities/product.entity';

export class ProductDomainService {
  validateProduct(product: Product) {
    if (!product.name || product.name.trim().length < 3) {
      throw new Error('Invalid product name');
    }
    if (product.price < 0) {
      throw new Error('Price cannot be negative');
    }
  }

 validateListFilters(filter: FilterProductDto) {
  if (filter.minPrice && filter.maxPrice) {
    if (Number(filter.minPrice) > Number(filter.maxPrice)) {
      throw new Error('minPrice cannot be greater than maxPrice');
    }
  }
}

  // Domain Rule: Product must exist before updating
  async ensureProductExists(product: Product | null, id: string) {
    if (!product) {
      // throw new Error(`Product with id ${id} not found`);
      throw new Error(`Product with id ${id} does not exist`)
    }
  }
}
