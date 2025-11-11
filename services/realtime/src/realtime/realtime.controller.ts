import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { RealtimeGateway } from './realtime.gateway';

/**
 * Real-Time REST Controller
 *
 * Provides HTTP endpoints for real-time service management and testing.
 * Allows external services to trigger WebSocket broadcasts.
 *
 * @author E-commerce Platform
 * @version 1.0.0
 */
@ApiTags('realtime')
@Controller('realtime')
export class RealtimeController {
  constructor(private readonly gateway: RealtimeGateway) {}

  /**
   * Get connection statistics
   *
   * Returns current WebSocket connection metrics.
   * Useful for monitoring and admin dashboards.
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get connection statistics',
    description:
      'Returns current WebSocket connection metrics including total connections, unique users, and per-user connection counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        totalConnections: 42,
        uniqueUsers: 35,
        userConnections: [
          { userId: 'user-123', connectionCount: 2 },
          { userId: 'admin@example.com', connectionCount: 1 },
        ],
      },
    },
  })
  getStats() {
    return this.gateway.getStats();
  }

  /**
   * Send test notification
   *
   * Sends a test notification to a specific user.
   * Useful for testing WebSocket connectivity.
   */
  @Post('test/notification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send test notification',
    description:
      'Sends a test notification to a specific user via WebSocket. Useful for testing connectivity.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'message'],
      properties: {
        userId: {
          type: 'string',
          example: 'user-123',
          description: 'Target user ID',
        },
        message: {
          type: 'string',
          example: 'This is a test notification',
          description: 'Notification message',
        },
        title: {
          type: 'string',
          example: 'Test',
          description: 'Notification title',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully',
  })
  async sendTestNotification(
    @Body()
    payload: {
      userId: string;
      message: string;
      title?: string;
    },
  ) {
    this.gateway.sendNotification(payload.userId, {
      type: 'test',
      title: payload.title || 'Test Notification',
      message: payload.message,
      priority: 'normal',
    });

    return {
      success: true,
      message: `Notification sent to user ${payload.userId}`,
    };
  }

  /**
   * Broadcast order update
   *
   * Manually trigger an order update broadcast.
   * Used by order service to notify users.
   */
  @Post('broadcast/order')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Broadcast order update',
    description:
      'Manually triggers an order update broadcast to a specific user. This endpoint is called by the order service.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'orderId', 'status'],
      properties: {
        userId: {
          type: 'string',
          example: 'user-123',
          description: 'User ID (order buyer)',
        },
        orderId: {
          type: 'string',
          example: 'order-456',
          description: 'Order ID',
        },
        status: {
          type: 'string',
          example: 'shipped',
          enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
          description: 'New order status',
        },
        previousStatus: {
          type: 'string',
          example: 'processing',
          description: 'Previous order status',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order update broadcast successfully',
  })
  async broadcastOrderUpdate(
    @Body()
    payload: {
      userId: string;
      orderId: string;
      status: string;
      previousStatus?: string;
    },
  ) {
    this.gateway.sendOrderUpdated(payload.userId, {
      orderId: payload.orderId,
      status: payload.status,
      previousStatus: payload.previousStatus,
      updatedAt: new Date().toISOString(),
      message: `Order status updated to ${payload.status}`,
    });

    return {
      success: true,
      message: `Order update broadcast to user ${payload.userId}`,
    };
  }

  /**
   * Broadcast inventory update
   *
   * Manually trigger an inventory update broadcast.
   * Used by inventory service to notify all subscribed clients.
   */
  @Post('broadcast/inventory')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Broadcast inventory update',
    description:
      'Manually triggers an inventory update broadcast to all subscribed clients. Called by the inventory service when stock changes.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['productId', 'stock'],
      properties: {
        productId: {
          type: 'string',
          example: 'prod-789',
          description: 'Product ID',
        },
        stock: {
          type: 'number',
          example: 5,
          description: 'Current stock level',
        },
        previousStock: {
          type: 'number',
          example: 10,
          description: 'Previous stock level',
        },
        sku: {
          type: 'string',
          example: 'SKU-001',
          description: 'Product SKU',
        },
        productName: {
          type: 'string',
          example: 'Premium Headphones',
          description: 'Product name',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory update broadcast successfully',
  })
  async broadcastInventoryUpdate(
    @Body()
    payload: {
      productId: string;
      stock: number;
      previousStock?: number;
      sku?: string;
      productName?: string;
    },
  ) {
    this.gateway.sendInventoryUpdate(payload);

    return {
      success: true,
      message: `Inventory update broadcast for product ${payload.productId}`,
    };
  }

  /**
   * Broadcast to all admin users
   *
   * Sends a message to all connected admin users.
   */
  @Post('broadcast/admin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Broadcast to admin dashboard',
    description: 'Sends a message to all connected admin users.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['event', 'data'],
      properties: {
        event: {
          type: 'string',
          example: 'admin:alert',
          description: 'Event name',
        },
        data: {
          type: 'object',
          example: { message: 'New order received', orderId: '123' },
          description: 'Event payload',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Broadcast sent to admins successfully',
  })
  async broadcastToAdmins(
    @Body() payload: { event: string; data: any },
  ) {
    this.gateway.broadcastToAdmins(payload.event, payload.data);

    return {
      success: true,
      message: `Broadcast sent to all admins`,
    };
  }
}
