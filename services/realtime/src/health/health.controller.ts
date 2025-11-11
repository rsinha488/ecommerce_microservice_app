import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Health Check Controller
 *
 * Provides health check endpoints for monitoring and load balancers.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns service health status. Used by Docker and load balancers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        service: 'realtime-service',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 12345,
      },
    },
  })
  check() {
    return {
      status: 'ok',
      service: 'realtime-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Checks if service is ready to accept connections.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
  })
  ready() {
    return {
      status: 'ready',
      service: 'realtime-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Checks if service is alive.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
  })
  live() {
    return {
      status: 'live',
      service: 'realtime-service',
      timestamp: new Date().toISOString(),
    };
  }
}
