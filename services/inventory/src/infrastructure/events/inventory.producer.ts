import { Injectable, Logger } from '@nestjs/common';
// wire to your Kafka producer (already used in product-service)
@Injectable()
export class InventoryProducer {
  private readonly logger = new Logger(InventoryProducer.name);

  async publishStockChanged(payload: { sku: string; newStock: number; delta: number }) {
    // For scaffold: just log; integrate with kafkajs in production
    this.logger.log(`Stock changed ${payload.sku} -> ${payload.newStock} (delta ${payload.delta})`);
    // TODO: publish to kafka topic 'inventory.stock.changed'
  }
}
