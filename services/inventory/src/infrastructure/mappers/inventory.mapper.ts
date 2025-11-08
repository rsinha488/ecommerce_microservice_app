import { InventoryItem } from '../../domain/entities/inventory-item.entity';
export class InventoryMapper {
  static toDomain(doc: any): InventoryItem | null {
    if (!doc) return null;
    return new InventoryItem(
      doc._id?.toString() ?? doc.id,
      doc.sku,
      doc.stock,
      doc.reserved ?? 0,
      doc.location,
      doc.updatedAt,
      doc.createdAt,
    );
  }

  toResponse(item: InventoryItem) {
    return {
      id: item.id,
      sku: item.sku,
      stock: item.stock,
      reserved: item.reserved,
      location: item.location,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
