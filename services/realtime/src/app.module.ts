import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RealtimeModule } from './realtime/realtime.module';
import { KafkaModule } from './kafka/kafka.module';
import { HealthModule } from './health/health.module';

/**
 * Root Application Module
 *
 * Orchestrates all modules for the Real-Time WebSocket Service
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.production', '.env.local', '.env'],
    }),

    // Real-time WebSocket module
    RealtimeModule,

    // Kafka event consumer module
    KafkaModule,

    // Health check module
    HealthModule,
  ],
})
export class AppModule {}
