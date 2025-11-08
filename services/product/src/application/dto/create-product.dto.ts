import { 
  IsString, 
  IsNumber, 
  IsArray, 
  MinLength, 
  IsNotEmpty, 
  IsPositive 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {

  @ApiProperty({
    description: 'Name of the product',
    example: 'Apple iPhone 15',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Detailed description of the product',
    example: 'Latest iPhone with A17 Bionic chip.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Price of the product',
    example: 999.99,
  })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({
    description: 'Unique SKU identifier for the product',
    example: 'IPH-15-256-BLK',
  })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty({
    description: 'Category of the product',
    example: 'Electronics',
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({
    description: 'Available stock for the product',
    example: 50,
  })
  @IsNumber()
  stock!: number;

  @ApiProperty({
    description: 'Array of product images in Base64 format',
    example: [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABA...'
    ],
    isArray: true,
    type: String,
  })
  @IsArray()
  images!: string[];
}
