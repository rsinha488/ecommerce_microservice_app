import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

import { CreateOrderUseCase } from '../../application/use-cases/create-order.usecase';
import { GetOrderUseCase } from '../../application/use-cases/get-order.usecase';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.usecase';

import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { FilterOrderDto } from '../../application/dto/filter-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
  ) {}

  // -----------------------------
  // Create Order
  // -----------------------------
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    schema: {
      example: { id: 'order-123', status: 'PENDING' },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.createOrder.execute(dto);
    return { id: order.id, status: order.status };
  }

  // -----------------------------
  //  Get Order by ID
  // -----------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiParam({ name: 'id', example: 'order-123' })
  @ApiResponse({
    status: 200,
    description: 'Order fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async get(@Param('id') id: string) {
    return this.getOrder.execute(id);
  }

  // -----------------------------
  //  List Orders
  // -----------------------------
  @Get()
  @ApiOperation({ summary: 'List orders with optional filters' })
  @ApiQuery({ name: 'buyerId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of orders returned successfully',
  })
  async list(@Query() q: FilterOrderDto) {
    return this.listOrders.execute(q);
  }
}
