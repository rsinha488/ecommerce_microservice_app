import { Injectable } from '@nestjs/common';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { InventoryProducer } from '../../infrastructure/events/inventory.producer';
import { RedisLockService } from '../../infrastructure/redis/redis-lock.service';

@Injectable()
export class AdjustStockUseCase {
  constructor(
    private readonly repo: InventoryRepository,
    private readonly producer: InventoryProducer,
    private readonly lockService: RedisLockService,
  ) {}

  async execute(sku: string, delta: number) {
    // Acquire a short lock per SKU to avoid race conditions
    const lockKey = `inventory:lock:${sku}`;
    const token = await this.lockService.acquireLock(lockKey, 5000);
    if (!token) throw new Error('Could not acquire lock');

    try {
      const before = await this.repo.findBySku(sku);
      if (!before) throw new Error('Item not found');

      const updated = await this.repo.adjustStock(sku, delta);
      await this.producer.publishStockChanged({ sku, newStock: updated.stock, delta });
      return updated;
    } finally {
      await this.lockService.releaseLock(lockKey, token);
    }
  }
}
