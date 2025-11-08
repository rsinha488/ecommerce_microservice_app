export class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public price: number,
    public sku: string,
    public category: string,
    public stock: number,
    public images: string[],
    public isActive: boolean = true,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}
