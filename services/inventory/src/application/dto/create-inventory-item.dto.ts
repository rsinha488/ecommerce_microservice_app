import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  sku!: string;

  @IsNumber()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsString()
  location?: string;
}
