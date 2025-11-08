export class Money {
  constructor(public amount: number, public currency = 'USD') {
    if (amount < 0) throw new Error('Amount must be >= 0');
  }
}
