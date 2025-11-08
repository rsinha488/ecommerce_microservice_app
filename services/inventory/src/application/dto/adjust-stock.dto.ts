import { IsString, IsNumber } from 'class-validator';

export class AdjustStockDto {
  @IsString()
  sku!: string;

  @IsNumber()
  delta!: number; // positive => add stock, negative => remove stock
}
