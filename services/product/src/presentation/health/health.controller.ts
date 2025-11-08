import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheckService, 
  HealthCheck, 
  MongooseHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoHealth: MongooseHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // MongoDB connection health
      () => this.mongoHealth.pingCheck('mongodb'),
      
      // Disk storage health
      () => this.disk.checkStorage('storage', { 
        thresholdPercent: 0.9, 
        path: '/' 
      }),
      
      // Memory health
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),  // 300MB
    ]);
  }
}
