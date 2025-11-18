import { Body, Controller, Get, Param, Post, Query, Patch, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

import { CreateOrderUseCase } from '../../application/use-cases/create-order.usecase';
import { GetOrderUseCase } from '../../application/use-cases/get-order.usecase';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.usecase';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.usecase';

import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { FilterOrderDto } from '../../application/dto/filter-order.dto';

/**
 * Order Controller
 *
 * Handles all HTTP requests related to order management.
 * This controller provides endpoints for creating, retrieving, listing,
 * and updating order statuses with proper error handling and validation.
 *
 * @remarks
 * - All responses follow a consistent format with success/error status
 * - Proper HTTP status codes are returned for different scenarios
 * - Input validation is handled through DTOs
 * - Business logic is delegated to use cases for clean separation of concerns
 *
 * @example
 * POST /order/orders - Create a new order
 * GET /order/orders/:id - Get order by ID
 * GET /order/orders - List all orders with optional filters
 * PATCH /order/orders/:id/status - Update order status
 */
@ApiTags('orders')
@Controller('order/orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
  ) {
    this.logger.log('✅ OrderController initialized');
  }

  /**
   * Create a new order
   *
   * Creates a new order with the provided order details including items,
   * shipping address, and buyer information. This endpoint validates the
   * order data, checks inventory availability, reserves stock, and emits
   * events for order creation.
   *
   * @param dto - Order creation data transfer object containing:
   *   - buyerId: Customer ID placing the order
   *   - items: Array of order items with SKU, quantity, and pricing
   *   - shippingAddress: Delivery address details
   *   - currency: Order currency (default: USD)
   *
   * @returns Promise<{success: boolean, message: string, data: Order}>
   *
   * @throws HttpException(400) - If validation fails or data is invalid
   * @throws HttpException(409) - If inventory is insufficient
   * @throws HttpException(500) - If order creation fails due to system error
   *
   * @example
   * POST /order/orders
   * Body: {
   *   "buyerId": "user-123",
   *   "items": [{"sku": "SKU-001", "quantity": 2, "unitPrice": 29.99}],
   *   "shippingAddress": {"street": "123 Main St", "city": "NYC", ...}
   * }
   */
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid data' })
  @ApiResponse({ status: 409, description: 'Insufficient inventory for order items' })
  @ApiResponse({ status: 500, description: 'Internal server error during order creation' })
  async create(@Body() dto: CreateOrderDto) {
    try {
      this.logger.log(`📝 Creating new order for buyer: ${dto.buyerId}`);

      const result = await this.createOrder.execute(dto);

      this.logger.log(`✅ Order created successfully: ${result._id || result.id}`);
      return result;
    } catch (error: any) {
      this.logger.error(`❌ Failed to create order: ${error.message}`, error.stack);

      // Re-throw with appropriate status code if not already an HttpException
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle specific error cases
      if (error.message?.includes('Insufficient') || error.message?.includes('inventory')) {
        throw new HttpException(
          {
            success: false,
            message: 'Unable to create order due to insufficient inventory',
            error: error.message,
          },
          HttpStatus.CONFLICT,
        );
      }

      if (error.message?.includes('Invalid') || error.message?.includes('validation')) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid order data provided',
            error: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Generic server error
      throw new HttpException(
        {
          success: false,
          message: 'An unexpected error occurred while creating the order',
          error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get order by ID
   *
   * Retrieves a specific order by its unique identifier.
   * Returns complete order details including items, status, and shipping information.
   *
   * @param id - Unique order identifier (orderId or _id)
   *
   * @returns Promise<Order> - Complete order object
   *
   * @throws HttpException(404) - If order with given ID is not found
   * @throws HttpException(400) - If ID format is invalid
   * @throws HttpException(500) - If retrieval fails due to system error
   *
   * @example
   * GET /order/orders/order-123
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiParam({ name: 'id', example: 'order-123', description: 'Unique order identifier' })
  @ApiResponse({
    status: 200,
    description: 'Order fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Invalid order ID format' })
  async get(@Param('id') id: string) {
    try {
      this.logger.log(`🔍 Fetching order: ${id}`);

      if (!id || id.trim().length === 0) {
        throw new HttpException(
          {
            success: false,
            message: 'Order ID is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const order = await this.getOrder.execute(id);

      if (!order) {
        throw new HttpException(
          {
            success: false,
            message: `Order with ID '${id}' not found`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(`✅ Order fetched successfully: ${id}`);
      return order;
    } catch (error: any) {
      this.logger.error(`❌ Failed to fetch order ${id}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve order',
          error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * List orders with optional filters
   *
   * Retrieves a list of orders with optional filtering by buyer ID and status.
   * Results are sorted by creation date (newest first).
   *
   * @param q - Filter criteria object containing:
   *   - buyerId (optional): Filter orders by specific buyer
   *   - status (optional): Filter orders by status (pending, paid, cancelled, shipped, delivered)
   *
   * @returns Promise<Order[]> - Array of orders matching the filter criteria
   *
   * @throws HttpException(500) - If listing fails due to system error
   *
   * @example
   * GET /order/orders?buyerId=user-123&status=pending
   */
  @Get()
  @ApiOperation({ summary: 'List orders with optional filters' })
  @ApiQuery({ name: 'buyerId', required: false, description: 'Filter by buyer ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiResponse({
    status: 200,
    description: 'List of orders returned successfully',
  })
  @ApiResponse({ status: 500, description: 'Failed to retrieve orders' })
  async list(@Query() q: FilterOrderDto) {
    try {
      this.logger.log(`📋 Listing orders with filters: ${JSON.stringify(q)}`);

      const orders = await this.listOrders.execute(q);

      this.logger.log(`✅ Retrieved ${Array.isArray(orders) ? orders.length : 0} orders`);
      return orders;
    } catch (error: any) {
      this.logger.error(`❌ Failed to list orders: ${error.message}`, error.stack);

      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve orders list',
          error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update order status (Admin only)
   *
   * Updates the status of an existing order. This operation triggers various
   * business logic including inventory updates, notifications, and event emissions.
   *
   * Status transitions:
   * - pending → paid/cancelled
   * - paid → shipped/cancelled
   * - shipped → delivered/cancelled
   * - delivered → final state
   * - cancelled → final state
   *
   * @param id - Unique order identifier
   * @param status - New order status (pending, paid, cancelled, shipped, delivered)
   *
   * @returns Promise<Order> - Updated order object
   *
   * @throws HttpException(404) - If order is not found
   * @throws HttpException(400) - If status transition is invalid
   * @throws HttpException(500) - If update fails due to system error
   *
   * @example
   * PATCH /order/orders/order-123/status
   * Body: { "status": "shipped" }
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (Admin)' })
  @ApiParam({ name: 'id', example: 'order-123', description: 'Unique order identifier' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'paid', 'processing', 'cancelled', 'shipped', 'delivered'],
          example: 'shipped',
          description: 'New order status',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Invalid status or status transition' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    try {
      this.logger.log(`🔄 Updating order ${id} status to: ${status}`);

      // Validate status value
      const validStatuses = ['pending', 'paid', 'processing', 'cancelled', 'shipped', 'delivered'];
      if (!validStatuses.includes(status)) {
        throw new HttpException(
          {
            success: false,
            message: `Invalid status '${status}'. Valid statuses are: ${validStatuses.join(', ')}`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedOrder = await this.updateOrderStatus.execute(id, status);

      if (!updatedOrder) {
        throw new HttpException(
          {
            success: false,
            message: `Order with ID '${id}' not found`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(`✅ Order ${id} status updated to: ${status}`);
      return updatedOrder;
    } catch (error: any) {
      this.logger.error(`❌ Failed to update order ${id} status: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to update order status',
          error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
