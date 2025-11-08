import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private logger = new Logger(RedisService.name);

  onModuleInit(): void {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = Number(process.env.REDIS_PORT || 6379);
    const url = process.env.REDIS_URL || undefined;

    this.client = url ? new Redis(url) : new Redis({ host, port });

    this.client.on('connect', () => this.logger.log('✅ Redis connected'));
    this.client.on('error', (err) => this.logger.error('❌ Redis error', err));
  }

  getClient(): Redis {
    if (!this.client) throw new Error('Redis client not initialized');
    return this.client;
  }

  async quit(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger.log('🛑 Redis disconnected');
    }
  }

  onModuleDestroy(): void {
    this.quit().catch((err) => this.logger.error('Error closing Redis', err));
  }
}
