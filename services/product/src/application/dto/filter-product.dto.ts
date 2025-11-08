// src/application/dto/filter-product.dto.ts

import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class FilterProductDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  // ✅ Price filter must be numeric (string allowed via query)
  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;
}
