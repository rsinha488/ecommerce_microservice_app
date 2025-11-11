import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeController } from './realtime.controller';

/**
 * Real-Time Module
 *
 * Provides WebSocket gateway and REST API for real-time operations.
 */
@Module({
  controllers: [RealtimeController],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
