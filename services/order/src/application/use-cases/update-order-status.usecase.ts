import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { OrderRepositoryInterface, ORDER_REPOSITORY } from '../../domain/interfaces/order-repository.interface';
import { Order } from '../../domain/entities/order.entity';

/**
 * Update Order Status Use Case
 *
 * Handles updating the status of an existing order.
 * Used primarily by administrators to move orders through their lifecycle.
 */
@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryInterface
  ) {}

  /**
   * Execute the update order status operation
   * @param id - Order ID
   * @param status - New status for the order
   * @returns Updated order entity
   * @throws NotFoundException if order doesn't exist
   */
  async execute(id: string, status: string): Promise<Order> {
    // Validate order exists
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Update the status
    const updatedOrder = await this.orderRepository.updateStatus(id, status);
    if (!updatedOrder) {
      throw new NotFoundException(`Failed to update order ${id}`);
    }

    return updatedOrder;
  }
}
