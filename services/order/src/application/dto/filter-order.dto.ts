import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterOrderDto {
  @ApiPropertyOptional({ example: 'user-123', description: 'Filter by buyer ID' })
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiPropertyOptional({ example: 'PENDING', description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;
}
