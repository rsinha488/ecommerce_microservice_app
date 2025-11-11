import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  // Endpoints to skip caching
  private readonly skipCachePaths = ['/auth', '/order'];

  // TTL configuration in seconds
  private readonly ttlConfig = {
    products: {
      list: parseInt(process.env.CACHE_TTL_PRODUCT_LIST || '60', 10), // 60 seconds for product lists
      single: parseInt(process.env.CACHE_TTL_PRODUCT_SINGLE || '300', 10), // 300 seconds for single products
    },
    inventory: parseInt(process.env.CACHE_TTL_INVENTORY || '30', 10), // 30 seconds for inventory
    default: parseInt(process.env.CACHE_TTL_DEFAULT || '60', 10), // 60 seconds default
  };

  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Skip caching for auth and order endpoints
    if (this.shouldSkipCache(request.path)) {
      this.logger.debug(`Skipping cache for path: ${request.path}`);
      return next.handle();
    }

    // Generate cache key based on URL and query params
    const cacheKey = this.generateCacheKey(request);

    try {
      // Try to get from cache
      const cachedData = await this.redisService.get(cacheKey);

      if (cachedData) {
        this.logger.debug(`Cache HIT for key: ${cacheKey}`);
        response.setHeader('X-Cache-Status', 'HIT');

        // Parse and return cached data
        const parsedData = JSON.parse(cachedData);
        return of(parsedData);
      }

      this.logger.debug(`Cache MISS for key: ${cacheKey}`);
      response.setHeader('X-Cache-Status', 'MISS');

      // If not in cache, proceed with the request and cache the response
      return next.handle().pipe(
        tap(async (data) => {
          try {
            const ttl = this.getTTL(request.path);
            await this.redisService.set(cacheKey, JSON.stringify(data), ttl);
            this.logger.debug(`Cached response for key: ${cacheKey} with TTL: ${ttl}s`);
          } catch (error) {
            this.logger.error(`Error caching response: ${error.message}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error: ${error.message}`);
      // If Redis fails, continue without caching
      return next.handle();
    }
  }

  private shouldSkipCache(path: string): boolean {
    return this.skipCachePaths.some((skipPath) => path.startsWith(skipPath));
  }

  private generateCacheKey(request: Request): string {
    const url = request.url;
    const queryString = new URLSearchParams(request.query as any).toString();
    return `gateway:cache:${url}${queryString ? '?' + queryString : ''}`;
  }

  private getTTL(path: string): number {
    // Product list endpoint
    if (path.includes('/product') && !path.match(/\/product\/[^\/]+$/)) {
      return this.ttlConfig.products.list;
    }

    // Single product endpoint
    if (path.match(/\/product\/[^\/]+$/)) {
      return this.ttlConfig.products.single;
    }

    // Inventory endpoint
    if (path.includes('/inventory')) {
      return this.ttlConfig.inventory;
    }

    // Default TTL
    return this.ttlConfig.default;
  }
}
