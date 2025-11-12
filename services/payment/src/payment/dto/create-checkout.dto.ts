export class CreateCheckoutDto {
  orderId: string;
  userId: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  successUrl: string;
  cancelUrl: string;
}
