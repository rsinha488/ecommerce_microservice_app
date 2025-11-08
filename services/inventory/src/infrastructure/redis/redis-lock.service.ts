import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisLockService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisLockService.name);
  private client: Redis;

  constructor(private readonly config: ConfigService) {
    const redisUrl =
      this.config.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379';

    this.client = new Redis(redisUrl);

    this.client.on('error', (e) => {
      this.logger.error(`Redis connection error: ${e?.message || e}`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  /**
   * Generate a random unique lock token
   */
  private generateToken(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  /**
   * Acquire a lock using SET NX PX
   */
  async acquireLock(key: string, ttl = 5000): Promise<string | null> {
    const token = this.generateToken();

    const result = await this.client.set(key, token, 'PX', ttl, 'NX');

    return result === 'OK' ? token : null;
  }

  /**
   * Release a lock using Lua to ensure safety
   */
  async releaseLock(key: string, token: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.client.eval(script, 1, key, token);

    return result === 1;
  }

  /**
   * ✅ Correct signature for your subscribers:
   * withLock(key, async () => {...}, ttl?)
   */
  async withLock<T>(
    key: string,
    callback: () => Promise<T>,
    ttl = 5000,
  ): Promise<T> {
    const token = await this.acquireLock(key, ttl);

    if (!token) {
      throw new Error(`Unable to acquire lock for key: ${key}`);
    }

    try {
      return await callback();
    } catch (e: any) {
      this.logger.error(`withLock callback error: ${e?.message || e}`);
      throw e;
    } finally {
      const released = await this.releaseLock(key, token);

      if (!released) {
        this.logger.warn(`Failed to release lock for key: ${key}`);
      }
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
