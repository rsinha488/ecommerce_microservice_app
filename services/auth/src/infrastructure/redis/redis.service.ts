import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    // Support both REDIS_URL and separate REDIS_HOST/PORT/PASSWORD configuration
    if (process.env.REDIS_URL) {
      this.logger.log(`Connecting to Redis using REDIS_URL: ${process.env.REDIS_URL}`);
      this.client = new Redis(process.env.REDIS_URL);
    } else {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      };

      this.logger.log(`Connecting to Redis at ${redisConfig.host}:${redisConfig.port} (DB: ${redisConfig.db})`);
      this.client = new Redis(redisConfig);
    }

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected successfully');
    });

    this.client.on('ready', () => {
      this.logger.log('✅ Redis is ready to accept commands');
    });

    this.client.on('error', (err) => {
      this.logger.error(`❌ Redis connection error: ${err.message}`);
    });

    this.client.on('close', () => {
      this.logger.warn('⚠️  Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      this.logger.log('🔄 Reconnecting to Redis...');
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
