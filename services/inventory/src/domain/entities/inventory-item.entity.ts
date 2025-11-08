export class InventoryItem {
  constructor(
    public readonly id: string,
    public sku: string,
    public stock: number,
    public reserved: number,
    public location?: string,
    public sold: number = 0,
    public updatedAt?: Date,
    public createdAt?: Date
  ) {}
}