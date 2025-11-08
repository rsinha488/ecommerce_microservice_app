export class InventoryResponse {
  id!: string;
  sku!: string;
  stock!: number;
  reserved!: number;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
