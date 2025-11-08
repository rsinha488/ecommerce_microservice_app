import { HttpException, HttpStatus } from '@nestjs/common';

export class InventoryException extends HttpException {
  constructor(message: string, status: HttpStatus) {
    super(
      {
        status,
        error: message,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}

export class InsufficientStockException extends InventoryException {
  constructor(sku: string) {
    super(`Insufficient stock available for product SKU: ${sku}`, HttpStatus.BAD_REQUEST);
  }
}

export class ProductNotFoundException extends InventoryException {
  constructor(sku: string) {
    super(`Product with SKU: ${sku} not found`, HttpStatus.NOT_FOUND);
  }
}

export class InvalidStockOperationException extends InventoryException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class KafkaOperationException extends InventoryException {
  constructor(operation: string, details: string) {
    super(
      `Kafka operation failed: ${operation}. Details: ${details}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
