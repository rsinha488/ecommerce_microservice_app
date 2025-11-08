import { Product } from '../../domain/entities/product.entity';

export class ProductMapper {
  // ✅ DB → Domain
  static toDomain(raw: any): Product | null {
    if (!raw) return null;

    return new Product(
      raw._id?.toString() ?? raw.id,
      raw.name,
      raw.description,
      raw.price,
      raw.sku,
      raw.category,
      raw.stock,
      raw.images,
      raw.isActive,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  // ✅ Domain → API Response
  toResponse(product: Product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
      category: product.category,
      stock: product.stock,
      images: product.images,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  // ✅ Domain → Domain
  toEntity(raw: any): Product | null {
    return ProductMapper.toDomain(raw);
  }
}
