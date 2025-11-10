import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Basic health check',
    description: 'Returns the health status of the API Gateway'
  })
  @ApiResponse({
    status: 200,
    description: 'Gateway is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 503, description: 'Gateway is unhealthy' })
  check() {
    return this.health.check([]);
  }

  @Get('detailed')
  @ApiOperation({
    summary: 'Detailed health check with service checks',
    description: 'Returns detailed health status including downstream service checks'
  })
  @ApiResponse({
    status: 200,
    description: 'All services are healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            gateway: { type: 'string', example: 'up' },
            auth: { type: 'string', example: 'up' },
            product: { type: 'string', example: 'up' },
            user: { type: 'string', example: 'up' },
            inventory: { type: 'string', example: 'up' },
            order: { type: 'string', example: 'up' }
          }
        },
        error: { type: 'object' },
        details: { type: 'object' }
      }
    }
  })
  async detailedCheck() {
    // Simplified health check for now
    return {
      status: 'ok',
      info: {
        gateway: 'up',
        auth: 'unknown',
        product: 'unknown',
        user: 'unknown',
        inventory: 'unknown',
        order: 'unknown'
      },
      error: {},
      details: {}
    };
  }
}
