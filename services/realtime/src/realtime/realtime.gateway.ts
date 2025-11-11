import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * Real-Time WebSocket Gateway
 *
 * Handles WebSocket connections and real-time event broadcasting.
 * Implements Socket.IO for bidirectional communication.
 *
 * Features:
 * - User-specific channels (rooms)
 * - Order status updates
 * - Inventory notifications
 * - Admin dashboard broadcasts
 * - Automatic reconnection handling
 *
 * @author E-commerce Platform
 * @version 1.0.0
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  // Track connected users
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Called after WebSocket server initialization
   */
  afterInit(server: Server) {
    this.logger.log('✅ WebSocket Gateway Initialized');
    this.logger.log(`📡 Listening for connections on namespace: /`);
  }

  /**
   * Handle new client connection
   *
   * Extracts userId from query parameters and joins user to their personal room.
   * Also tracks the connection for managing multiple tabs/devices per user.
   *
   * @param client - Socket.IO client instance
   */
  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const token = client.handshake.query.token as string;

    this.logger.log(`🔌 Client connecting: ${client.id}`);

    // Basic authentication check (expand with JWT validation in production)
    if (!userId) {
      this.logger.warn(`❌ Connection rejected: No userId provided`);
      client.disconnect();
      return;
    }

    // TODO: Validate token with auth service
    // For now, accepting all connections with userId

    // Join user to their personal room
    await client.join(`user:${userId}`);

    // Track connection
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(client.id);

    // Check if user is admin
    const isAdmin = userId.toLowerCase().includes('admin');
    if (isAdmin) {
      await client.join('admin:dashboard');
      this.logger.log(`👑 Admin connected: ${userId}`);
    }

    this.logger.log(
      `✅ User connected → userId: ${userId}, socketId: ${client.id}`,
    );
    this.logger.log(
      `📊 Total connections: ${this.server.sockets.sockets.size}`,
    );

    // Send welcome message
    client.emit('connection:success', {
      message: 'Connected to real-time service',
      userId,
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle client disconnection
   *
   * Cleans up user tracking and logs disconnection.
   *
   * @param client - Socket.IO client instance
   */
  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;

    this.logger.log(`❌ Client disconnected: ${client.id}`);

    // Remove from tracking
    if (userId && this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId)!.delete(client.id);

      // If no more connections for this user, remove the entry
      if (this.connectedUsers.get(userId)!.size === 0) {
        this.connectedUsers.delete(userId);
        this.logger.log(`👋 User fully disconnected: ${userId}`);
      }
    }

    this.logger.log(
      `📊 Total connections: ${this.server.sockets.sockets.size}`,
    );
  }

  /**
   * Client subscribes to order updates
   */
  @SubscribeMessage('subscribe:orders')
  handleSubscribeOrders(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const room = `orders:${data.userId}`;
    client.join(room);
    this.logger.log(`📦 Client ${client.id} subscribed to orders: ${room}`);
    return { event: 'subscribed', data: { room, type: 'orders' } };
  }

  /**
   * Client subscribes to inventory updates
   */
  @SubscribeMessage('subscribe:inventory')
  handleSubscribeInventory(@ConnectedSocket() client: Socket) {
    client.join('inventory:updates');
    this.logger.log(`📊 Client ${client.id} subscribed to inventory updates`);
    return {
      event: 'subscribed',
      data: { room: 'inventory:updates', type: 'inventory' },
    };
  }

  /**
   * Client subscribes to admin dashboard updates
   */
  @SubscribeMessage('subscribe:admin')
  handleSubscribeAdmin(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;

    // Verify admin role (in production, check with auth service)
    const isAdmin = userId?.toLowerCase().includes('admin');

    if (!isAdmin) {
      this.logger.warn(
        `⛔ Non-admin user ${userId} attempted to subscribe to admin channel`,
      );
      return { event: 'error', data: { message: 'Admin access required' } };
    }

    client.join('admin:dashboard');
    this.logger.log(`👑 Admin ${userId} subscribed to dashboard updates`);
    return {
      event: 'subscribed',
      data: { room: 'admin:dashboard', type: 'admin' },
    };
  }

  /**
   * Client requests current connection count (admin only)
   */
  @SubscribeMessage('request:stats')
  handleRequestStats(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    const isAdmin = userId?.toLowerCase().includes('admin');

    if (!isAdmin) {
      return { event: 'error', data: { message: 'Admin access required' } };
    }

    const stats = {
      totalConnections: this.server.sockets.sockets.size,
      uniqueUsers: this.connectedUsers.size,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`📊 Stats requested by admin ${userId}`);
    return { event: 'stats', data: stats };
  }

  // ============================================
  // BROADCAST METHODS (Called by Kafka consumers)
  // ============================================

  /**
   * Broadcast order creation to user
   *
   * @param userId - User ID to send notification to
   * @param payload - Order data
   */
  sendOrderCreated(userId: string, payload: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit('order:created', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`📦 Order created notification sent to ${userId}`);

    // Also notify admin dashboard
    this.server.to('admin:dashboard').emit('admin:order:created', payload);
  }

  /**
   * Broadcast order status update to user
   *
   * @param userId - User ID to send notification to
   * @param payload - Order update data
   */
  sendOrderUpdated(userId: string, payload: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit('order:updated', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(
      `📦 Order ${payload.orderId} update sent to ${userId}: ${payload.status}`,
    );

    // Also notify admin dashboard
    this.server.to('admin:dashboard').emit('admin:order:updated', payload);
  }

  /**
   * Broadcast order cancellation to user
   *
   * @param userId - User ID to send notification to
   * @param payload - Order cancellation data
   */
  sendOrderCancelled(userId: string, payload: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit('order:cancelled', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`❌ Order ${payload.orderId} cancellation sent to ${userId}`);

    // Also notify admin dashboard
    this.server.to('admin:dashboard').emit('admin:order:cancelled', payload);
  }

  /**
   * Broadcast inventory update to all subscribed clients
   *
   * @param payload - Inventory update data
   */
  sendInventoryUpdate(payload: any) {
    this.server.to('inventory:updates').emit('inventory:updated', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(
      `📊 Inventory update for product ${payload.productId}: ${payload.stock}`,
    );

    // Also notify admin dashboard
    this.server.to('admin:dashboard').emit('admin:inventory:updated', payload);
  }

  /**
   * Send notification to specific user
   *
   * @param userId - User ID to send notification to
   * @param payload - Notification data
   */
  sendNotification(userId: string, payload: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit('notification', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`🔔 Notification sent to ${userId}: ${payload.message}`);
  }

  /**
   * Broadcast to all admin users
   *
   * @param event - Event name
   * @param payload - Event data
   */
  broadcastToAdmins(event: string, payload: any) {
    this.server.to('admin:dashboard').emit(event, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`👑 Admin broadcast: ${event}`);
  }

  /**
   * Broadcast to all connected users
   *
   * @param event - Event name
   * @param payload - Event data
   */
  broadcastToAll(event: string, payload: any) {
    this.server.emit(event, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`📢 Global broadcast: ${event}`);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.server.sockets.sockets.size,
      uniqueUsers: this.connectedUsers.size,
      userConnections: Array.from(this.connectedUsers.entries()).map(
        ([userId, sockets]) => ({
          userId,
          connectionCount: sockets.size,
        }),
      ),
    };
  }
}
