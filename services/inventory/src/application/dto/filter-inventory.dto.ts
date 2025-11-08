import { IsOptional, IsString } from 'class-validator';

export class FilterInventoryDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
