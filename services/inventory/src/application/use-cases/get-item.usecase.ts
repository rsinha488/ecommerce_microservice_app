import { Injectable } from '@nestjs/common';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
@Injectable()
export class GetItemUseCase {
  constructor(private readonly repo: InventoryRepository) {}
  async execute(sku: string) {
    return this.repo.findBySku(sku);
  }
}
