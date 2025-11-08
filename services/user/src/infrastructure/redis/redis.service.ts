import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

    this.client.on('connect', () => console.log('✅ Redis connected'));
    this.client.on('error', (err) => console.error('❌ Redis error:', err));
  }

  async setLock(key: string, ttl = 5000) {
    return await this.client.set(key, 'locked', 'PX', ttl, 'NX');
  }

  async releaseLock(key: string) {
    return await this.client.del(key);
  }

  // ✅ Add THIS method to support test cleanup
  async quit() {
    await this.client.quit();
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
