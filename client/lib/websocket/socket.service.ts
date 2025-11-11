import { io, Socket } from 'socket.io-client';

export interface SocketConfig {
  userId?: string;
  token?: string;
  role?: 'admin' | 'user';
}

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private config: SocketConfig = {};

  constructor() {
    // Socket will be initialized when connect() is called
  }

  connect(config: SocketConfig): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.config = config;
    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3009';

    console.log(`[WebSocket] Connecting to ${socketUrl}...`);

    this.socket = io(socketUrl, {
      query: {
        userId: config.userId || '',
        token: config.token || '',
        role: config.role || 'user',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      this.reconnectAttempts = 0;
    });

    this.socket.on('connection:success', (data) => {
      console.log('[WebSocket] Connection success:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Socket error:', error);
    });
  }

  subscribeToOrders(callback: (data: any) => void): void {
    if (!this.socket) return;
    this.socket.emit('subscribe:orders');
    this.socket.on('order:created', callback);
    this.socket.on('order:updated', callback);
    this.socket.on('order:cancelled', callback);
  }

  subscribeToInventory(callback: (data: any) => void): void {
    if (!this.socket) return;
    this.socket.emit('subscribe:inventory');
    this.socket.on('inventory:updated', callback);
  }

  subscribeToAdmin(callback: (event: string, data: any) => void): void {
    if (!this.socket || this.config.role !== 'admin') return;
    this.socket.emit('subscribe:admin');
    this.socket.on('admin:order:created', (data) => callback('order:created', data));
    this.socket.on('admin:order:updated', (data) => callback('order:updated', data));
    this.socket.on('admin:inventory:updated', (data) => callback('inventory:updated', data));
  }

  subscribeToNotifications(callback: (data: any) => void): void {
    if (!this.socket) return;
    this.socket.on('notification', callback);
  }

  unsubscribeAll(): void {
    if (!this.socket) return;
    this.socket.off('order:created');
    this.socket.off('order:updated');
    this.socket.off('order:cancelled');
    this.socket.off('inventory:updated');
    this.socket.off('notification');
    this.socket.off('admin:order:created');
    this.socket.off('admin:order:updated');
    this.socket.off('admin:inventory:updated');
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.unsubscribeAll();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new WebSocketService();
