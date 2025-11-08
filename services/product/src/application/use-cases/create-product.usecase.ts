import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { CreateProductDto } from '../dto/create-product.dto';
import { PRODUCT_REPOSITORY, ProductRepositoryInterface } from '../../domain/interfaces/product-repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { ProductProducer } from '../../infrastructure/events/product.producer';

@Injectable()
export class CreateProductUseCase {
  private readonly logger = new Logger(CreateProductUseCase.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repo: ProductRepositoryInterface,

    private readonly producer: ProductProducer,
  ) {}

  /**
   * -------------------------------------------------------------
   * ✅ Use-case: Create a new product + emit Kafka event
   * -------------------------------------------------------------
   */
  async execute(dto: CreateProductDto) {
    try {
      // ✅ Create domain product entity
      const product = new Product(
        '',
        dto.name,
        dto.description,
        dto.price,
        dto.sku,
        dto.category,
        dto.stock,
        dto.images,
      );

      // ✅ Save product to database
      const created = await this.repo.create(product);

      // ✅ Emit Kafka event so inventory service creates stock entry
      await this.producer.emitProductCreatedEvent({
        sku: dto.sku,
        initialStock: dto.stock,
      });

      this.logger.log(`✅ Product created + event emitted | SKU=${dto.sku}`);

      return created;

    } catch (err) {
      this.logger.error(
        `❌ Product creation failed | SKU=${dto.sku} | Error: ${err.message}`,
      );

      /**
       * -------------------------------------------------------------
       * ✅ Handle common error types
       * -------------------------------------------------------------
       */
      if (err.code === 11000) {
        // MongoDB duplicate key — SKU already exists
        throw new HttpException(
          {
            success: false,
            code: 'PRODUCT_ALREADY_EXISTS',
            message: `Product with SKU "${dto.sku}" already exists`,
          },
          HttpStatus.CONFLICT,
        );
      }

      if (err.name === 'KafkaConnectionError') {
        throw new HttpException(
          {
            success: false,
            code: 'KAFKA_PRODUCER_ERROR',
            message: 'Failed to publish product.created event',
            details: err.message,
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        {
          success: false,
          code: 'PRODUCT_CREATION_FAILED',
          message: 'Failed to create product',
          details: err.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
