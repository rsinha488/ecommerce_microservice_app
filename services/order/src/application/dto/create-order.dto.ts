import { IsString, IsArray, ValidateNested, IsNumber, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CreateOrderItemDto {
  @ApiProperty({ example: 'SKU123', description: 'Unique product SKU' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 'Red T-shirt', description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 499, description: 'Unit price of the product' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ example: 2, description: 'Quantity purchased' })
  @IsNumber()
  quantity: number;
}

class ShippingAddressDto {
  @ApiProperty({ example: '123 Main St', description: 'Street address' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'New York', description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'NY', description: 'State' })
  @IsString()
  state: string;

  @ApiProperty({ example: '10001', description: 'Zip code' })
  @IsString()
  zipCode: string;

  @ApiProperty({ example: 'USA', description: 'Country' })
  @IsString()
  country: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'user-123', description: 'ID of the buyer' })
  @IsString()
  buyerId: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'List of items inside the order',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({
    type: ShippingAddressDto,
    description: 'Shipping address for the order',
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @ApiProperty({
    example: 'USD',
    description: 'Currency code of the order',
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;
}
