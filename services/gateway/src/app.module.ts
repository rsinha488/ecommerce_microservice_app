import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ProxyModule } from './proxy/proxy.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { CacheInterceptor } from './cache/cache.interceptor';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    // Redis for caching
    RedisModule,
    // Proxy module for routing requests
    ProxyModule,
    // Health checks
    HealthModule,
  ],
  controllers: [],
  providers: [
    // Global cache interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
