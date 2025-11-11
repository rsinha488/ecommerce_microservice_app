import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { CreateProductUseCase } from '../../application/use-cases/create-product.usecase';
import { ListProductsUseCase } from '../../application/use-cases/list-products.usecase';
import { GetProductUseCase } from '../../application/use-cases/get-product.usecase';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.usecase';

import { UpdateProductDto } from '../../application/dto/update-product.dto';
import { FilterProductDto } from '../../application/dto/filter-product.dto';
import { CreateProductDto } from '../../application/dto/create-product.dto';

@ApiTags('Products')
@Controller('product/products')
export class ProductController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
  ) { }

  /**
   * -------------------------------------------------------------
   * ✅ Create a new Product
   * -------------------------------------------------------------
   */
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({
    description: 'Payload to create a new product',
    type: CreateProductDto,
    examples: {
      default: {
        summary: 'Example product create payload',
        value: {
          name: 'Wireless Bluetooth Headphones',
          sku: 'WBH-12345',
          description: 'High-quality headphones with noise cancellation',
          price: 4599,
          stock: 120,
          category: 'electronics',
          images: [
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABA...',
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Duplicate SKU error' })
  @ApiResponse({ status: 503, description: 'Kafka unavailable' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() dto: CreateProductDto) {
    try {
      const product = await this.createProduct.execute(dto);

      return {
        success: true,
        message: 'Product created successfully',
        data: product,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          code: error.response?.code || 'PRODUCT_CREATE_ERROR',
          message: error.response?.message || 'Failed to create product',
          details: error.response?.details || error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * -------------------------------------------------------------
   * ✅ List products with filtering options
   * -------------------------------------------------------------
   */
  @Get()
  @ApiOperation({ summary: 'Get list of products with filtering options' })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    example: 'electronics',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'headphones',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    example: 1000,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    example: 5000,
  })
  // page
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Products fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async list(@Query() filters: FilterProductDto) {
    try {
      const result = await this.listProducts.execute(filters);

      return {
        success: true,
        message: 'Products fetched successfully',
        data: result.products,
        pagination: result.pagination,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          code: 'PRODUCT_LIST_ERROR',
          message: error.message || 'Failed to fetch products',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * -------------------------------------------------------------
   * ✅ Get a single product by ID
   * -------------------------------------------------------------
   */
  @Get(':id')
   @ApiParam({
    name: 'id',
    type: String,
    example: '67891f2c4edb2cf15c271239',
  })
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiResponse({ status: 200, description: 'Product fetched successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getOne(@Param('id') id: string) {
    try {
      const product = await this.getProduct.execute(id);

      return {
        success: true,
        message: 'Product fetched successfully',
        data: product,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          code: 'PRODUCT_FETCH_ERROR',
          message: 'Failed to fetch product',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * -------------------------------------------------------------
   * ✅ Update a product by ID
   * -------------------------------------------------------------
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a product by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    example: '67891f2c4edb2cf15c271239',
  })
  @ApiBody({
    type: UpdateProductDto,
    examples: {
      default: {
        summary: 'Example update payload',
        value: {
          name: 'Updated Headphones',
          price: 4999,
          stock: 90,
        },
      },
    },
  })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    try {
      const updated = await this.updateProduct.execute(id, dto);  // ✅ FIX

      return {
        success: true,
        message: 'Product updated successfully',
        data: updated,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          code: 'PRODUCT_UPDATE_ERROR',
          message: error.message || 'Failed to update product',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
