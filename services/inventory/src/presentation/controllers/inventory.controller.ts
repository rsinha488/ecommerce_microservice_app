import { Controller, Post, Body, Put, Param, Get, Query } from '@nestjs/common';
import { CreateItemUseCase } from '../../application/use-cases/create-item.usecase';
// import { AdjustStockUseCase } from '../../application/use-cases/adjust-stock.usecase';
import { GetItemUseCase } from '../../application/use-cases/get-item.usecase';
import { ListItemsUseCase } from '../../application/use-cases/list-items.usecase';
import { CreateInventoryItemDto } from '../../application/dto/create-inventory-item.dto';
// import { AdjustStockDto } from '../../application/dto/adjust-stock.dto';
import { FilterInventoryDto } from '../../application/dto/filter-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly createUseCase: CreateItemUseCase,
    // private readonly adjustUseCase: AdjustStockUseCase,
    private readonly getUseCase: GetItemUseCase,
    private readonly listUseCase: ListItemsUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateInventoryItemDto) {
    return this.createUseCase.execute(dto);
  }

  // @Put(':sku/adjust')
  // adjust(@Param('sku') sku: string, @Body() dto: AdjustStockDto) {
  //   return this.adjustUseCase.execute(sku, dto.delta);
  // }

  @Get(':sku')
  getOne(@Param('sku') sku: string) {
    return this.getUseCase.execute(sku);
  }

  @Get()
  list(@Query() q: FilterInventoryDto) {
    return this.listUseCase.execute(q);
  }
}
