import { Injectable } from '@nestjs/common';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { InventoryProducer } from '../../infrastructure/events/inventory.producer';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';

@Injectable()
export class CreateItemUseCase {
  constructor(private readonly repo: InventoryRepository, private readonly producer: InventoryProducer) {}

  async execute(dto: CreateInventoryItemDto) {
    // domain validations could go here (unique sku, etc.)
    const created = await this.repo.create({ sku: dto.sku, stock: dto.stock, location: dto.location });
    // publish event
    await this.producer.publishStockChanged({ sku: created.sku, newStock: created.stock, delta: created.stock });
    return created;
  }
}
