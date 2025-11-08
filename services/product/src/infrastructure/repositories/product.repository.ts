// src/infrastructure/repositories/product.repository.ts

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ProductRepositoryInterface } from '../../domain/interfaces/product-repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { ProductModel } from '../database/product.schema';
import { ProductMapper } from '../mappers/product.mapper';
import { FilterProductDto } from '../../application/dto/filter-product.dto';

@Injectable()
export class ProductRepository implements ProductRepositoryInterface {
  private readonly logger = new Logger(ProductRepository.name);

  constructor(
    @InjectModel(ProductModel.name)
    private readonly productModel: Model<ProductModel>,
  ) {}

  /**
   * ✅ Create Product
   */
  async create(product: Product): Promise<Product> {
    try {
      const created = await this.productModel.create(product);
      return ProductMapper.toDomain(created.toObject())!;
    } catch (error: any) {
      this.logger.error('❌ Failed to create product', error.message);
      throw new InternalServerErrorException({
        message: 'PRODUCT_CREATION_FAILED',
        details: error.message,
      });
    }
  }

  /**
   * ✅ Update Product by ID
   */
  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    try {
      const updated = await this.productModel
        .findByIdAndUpdate(id, product, { new: true })
        .lean();

      return ProductMapper.toDomain(updated);
    } catch (error: any) {
      this.logger.error(`❌ Failed to update product (ID=${id})`, error.message);
      throw new InternalServerErrorException({
        message: 'PRODUCT_UPDATE_FAILED',
        details: error.message,
      });
    }
  }

  /**
   * ✅ Find product by ID
   */
  async findById(id: string): Promise<Product | null> {
    try {
      const found = await this.productModel.findById(id).lean();
      return ProductMapper.toDomain(found);
    } catch (error: any) {
      this.logger.error(`❌ Failed to fetch product (ID=${id})`, error.message);
      throw new InternalServerErrorException({
        message: 'PRODUCT_FETCH_FAILED',
        details: error.message,
      });
    }
  }

  /**
   * ✅ List Products with Filtering (Domain-ready)
   * Ensures return type is Product[]
   */
  async findAll(filter: FilterProductDto): Promise<Product[]> {
    try {
      const query: any = {};

      // ✅ category filter
      if (filter.category) query.category = filter.category;

      // ✅ full-text search filter
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
        ];
      }

      // ✅ price range
      if (filter.minPrice) {
        query.price = { ...query.price, $gte: Number(filter.minPrice) };
      }
      if (filter.maxPrice) {
        query.price = { ...query.price, $lte: Number(filter.maxPrice) };
      }

      // ✅ Fetch raw JS objects using lean()
      const results = await this.productModel
        .find(query)
        .sort({ updatedAt: -1 })
        .lean();

      // ✅ Convert to Domain entities
      return results.map((doc) => ProductMapper.toDomain(doc)!);
    } catch (error: any) {
      this.logger.error('❌ Failed to fetch product list', error.message);
      throw new InternalServerErrorException({
        message: 'PRODUCT_LIST_FETCH_FAILED',
        details: error.message,
      });
    }
  }
}
