import { Injectable } from '@nestjs/common';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import type { FilterInventoryDto } from '../dto/filter-inventory.dto';

@Injectable()
export class ListItemsUseCase {
  constructor(private readonly repo: InventoryRepository) {}
  async execute(filter: FilterInventoryDto) {
    const q: any = {};
    if (filter.sku) q.sku = filter.sku;
    if (filter.location) q.location = filter.location;
    return this.repo.list(q);
  }
}
