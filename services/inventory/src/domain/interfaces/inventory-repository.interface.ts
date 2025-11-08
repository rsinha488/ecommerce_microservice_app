import { InventoryItem } from "../entities/inventory-item.entity";

export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');

export interface InventoryRepositoryInterface {
  create(item: Partial<InventoryItem>): Promise<InventoryItem>;
  update(sku: string, item: Partial<InventoryItem>): Promise<InventoryItem>;
  findBySku(sku: string): Promise<InventoryItem | null>;
  adjustStock(sku: string, delta: number): Promise<InventoryItem>;
  list(filters: any): Promise<InventoryItem[]>;
}
