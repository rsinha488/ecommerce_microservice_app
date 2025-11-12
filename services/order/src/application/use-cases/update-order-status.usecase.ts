import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { OrderRepositoryInterface, ORDER_REPOSITORY } from '../../domain/interfaces/order-repository.interface';
import { OrderMapper } from '../../infrastructure/mappers/order.mapper';
import { OrderProducer } from '../../infrastructure/events/order.producer';

/**
 * ✅ Update Order Status Use Case
 *
 * Handles updating the status of an existing order.
 * Used primarily by administrators to move orders through their lifecycle.
 *
 * Emits appropriate events based on status change:
 * - cancelled → order.cancelled (triggers inventory release)
 * - delivered → order.delivered (triggers stock deduction)
 * - shipped → order.shipped
 * - paid → order.paid
 * - other → order.updated
 */
@Injectable()
export class UpdateOrderStatusUseCase {
  private readonly logger = new Logger(UpdateOrderStatusUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryInterface,
    private readonly mapper: OrderMapper,
    private readonly producer: OrderProducer,
  ) {}

  /**
   * Execute the update order status operation
   * @param id - Order ID
   * @param status - New status for the order
   * @returns Updated order response
   * @throws NotFoundException if order doesn't exist
   */
  async execute(id: string, status: string) {
    // Validate order exists
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.logger.log(
      `Updating order ${id} status from ${existingOrder.status} to ${status}`
    );

    // Update the status
    const updatedOrder = await this.orderRepository.updateStatus(id, status);
    if (!updatedOrder) {
      throw new NotFoundException(`Failed to update order ${id}`);
    }

    // Emit appropriate event based on status
    try {
      await this.emitStatusEvent(updatedOrder);
    } catch (error: any) {
      this.logger.error(
        `Failed to emit event for order ${id} status ${status}:`,
        error
      );
      // Don't throw - order is already updated, event failure shouldn't rollback
    }

    return this.mapper.toResponse(updatedOrder);
  }

  /**
   * Emit the appropriate event based on order status
   */
  private async emitStatusEvent(order: any): Promise<void> {
    switch (order.status) {
      case 'cancelled':
        await this.producer.orderCancelled(order);
        break;

      case 'delivered':
        await this.producer.orderDelivered(order);
        break;

      case 'shipped':
        await this.producer.orderShipped(order);
        break;

      case 'paid':
        await this.producer.orderPaid(order);
        break;

      default:
        // For any other status change, emit generic update event
        await this.producer.orderUpdated(order);
        break;
    }
  }
}
