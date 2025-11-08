export class OrderResponse {
  id: string;
  buyerId: string;
  items: any[];
  total: number;
  currency: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}
