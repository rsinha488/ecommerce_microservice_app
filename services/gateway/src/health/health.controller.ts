import { Controller, Get, Param } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProxyService } from '../proxy/proxy.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private proxyService: ProxyService,
    private redisService: RedisService,
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
    description: 'Returns detailed health status including downstream service checks and Redis connectivity'
  })
  @ApiResponse({
    status: 200,
    description: 'All services are healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-11-11T10:30:00.000Z' },
        redis: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'up' },
            connected: { type: 'boolean', example: true }
          }
        },
        services: {
          type: 'object',
          properties: {
            auth: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                instances: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      url: { type: 'string', example: 'http://auth:4000' },
                      healthy: { type: 'boolean', example: true },
                      circuitState: { type: 'string', example: 'closed' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  async detailedCheck() {
    const services = this.proxyService.getAllServices();
    const serviceStatus: any = {};
    let overallStatus = 'ok';
    const errors: string[] = [];

    // Check Redis connectivity
    const redisHealthy = await this.redisService.ping();
    const redisStatus = {
      status: redisHealthy ? 'up' : 'down',
      connected: redisHealthy
    };

    if (!redisHealthy) {
      overallStatus = 'degraded';
      errors.push('Redis connection failed');
    }

    // Check each microservice
    for (const service of services) {
      const instances = this.proxyService.getServiceInstances(service);
      const serviceHealthy = await this.proxyService.checkServiceHealth(service);

      const instanceDetails = instances.map(instance => ({
        url: instance.url,
        healthy: instance.healthy,
        circuitState: instance.circuitState,
        failures: instance.failures,
      }));

      serviceStatus[service] = {
        status: serviceHealthy ? 'up' : 'down',
        instances: instanceDetails,
        healthyInstances: instanceDetails.filter(i => i.healthy).length,
        totalInstances: instanceDetails.length,
      };

      if (!serviceHealthy) {
        overallStatus = 'degraded';
        errors.push(`${service} service has no healthy instances`);
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      services: serviceStatus,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  @Get('services/:service')
  @ApiOperation({
    summary: 'Check health of a specific service',
    description: 'Returns health status of a specific microservice and its instances'
  })
  async checkService(@Param('service') service: string) {
    const instances = this.proxyService.getServiceInstances(service);

    if (!instances || instances.length === 0) {
      return {
        status: 'not_found',
        message: `Service ${service} not configured`,
      };
    }

    const serviceHealthy = await this.proxyService.checkServiceHealth(service);

    const instanceDetails = instances.map(instance => ({
      url: instance.url,
      healthy: instance.healthy,
      circuitState: instance.circuitState,
      failures: instance.failures,
    }));

    return {
      status: serviceHealthy ? 'up' : 'down',
      service,
      instances: instanceDetails,
      healthyInstances: instanceDetails.filter(i => i.healthy).length,
      totalInstances: instanceDetails.length,
      timestamp: new Date().toISOString(),
    };
  }
}
