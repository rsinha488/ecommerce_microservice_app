import { Product } from '../entities/product.entity';

// ✅ Token used by NestJS DI (runtime)
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

// ✅ TypeScript-only interface
export interface ProductRepositoryInterface {
  create(product: Product): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  findAll(filters: any): Promise<Product[]>;
}
