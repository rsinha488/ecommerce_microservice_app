import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as http from 'http';
import * as https from 'https';

interface ServiceInstance {
  url: string;
  healthy: boolean;
  failures: number;
  circuitState: 'closed' | 'open' | 'half-open';
  lastFailureTime?: number;
  successCount: number;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  // Service instances with load balancing support
  private serviceInstances: Map<string, ServiceInstance[]> = new Map();
  private currentIndex: Map<string, number> = new Map();

  // Circuit breaker configuration
  private readonly FAILURE_THRESHOLD = 5; // Open circuit after 5 consecutive failures
  private readonly CIRCUIT_TIMEOUT = 30000; // Half-open after 30 seconds
  private readonly SUCCESS_THRESHOLD = 3; // Close circuit after 3 successful requests

  // Headers that should NOT be forwarded
  private readonly headersToRemove = [
    'host',
    'connection',
    'keep-alive',
    'transfer-encoding',
    'upgrade',
    'proxy-connection',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
  ];

  constructor() {
    this.initializeServiceInstances();
  }

  private initializeServiceInstances() {
    const services = ['auth', 'user', 'product', 'inventory', 'order'];

    for (const service of services) {
      const urlsEnv = process.env[`${service.toUpperCase()}_SERVICE_URLS`];
      const singleUrlEnv = process.env[`${service.toUpperCase()}_SERVICE_URL`];

      if (urlsEnv) {
        // Support multiple instances for load balancing
        const urls = urlsEnv.split(',').map(url => url.trim());
        const instances: ServiceInstance[] = urls.map(url => ({
          url,
          healthy: true,
          failures: 0,
          circuitState: 'closed',
          successCount: 0,
        }));
        this.serviceInstances.set(service, instances);
        this.logger.log(`Initialized ${service} service with ${instances.length} instances: ${urls.join(', ')}`);
      } else if (singleUrlEnv) {
        // Fallback to single instance
        const instances: ServiceInstance[] = [{
          url: singleUrlEnv,
          healthy: true,
          failures: 0,
          circuitState: 'closed',
          successCount: 0,
        }];
        this.serviceInstances.set(service, instances);
        this.logger.log(`Initialized ${service} service with single instance: ${singleUrlEnv}`);
      } else {
        // Default localhost URLs
        const defaultUrl = `http://localhost:${this.getDefaultPort(service)}`;
        const instances: ServiceInstance[] = [{
          url: defaultUrl,
          healthy: true,
          failures: 0,
          circuitState: 'closed',
          successCount: 0,
        }];
        this.serviceInstances.set(service, instances);
        this.logger.warn(`Using default URL for ${service}: ${defaultUrl}`);
      }

      this.currentIndex.set(service, 0);
    }
  }

  private getDefaultPort(service: string): number {
    const ports = {
      auth: 4000,
      user: 3001,
      product: 3002,
      inventory: 3003,
      order: 5003,
    };
    return ports[service] || 3000;
  }

  async proxyRequest(service: string, req: Request, res: Response): Promise<void> {
    const instance = this.selectHealthyInstance(service);

    if (!instance) {
      this.logger.error(`No healthy instances available for service: ${service}`);
      res.status(503).json({
        error: 'Service Unavailable',
        message: `No healthy instances available for ${service} service`
      });
      return;
    }

    this.logger.log(`Proxying request to ${service} at ${instance.url}`);

    try {
      await this.performProxyRequest(instance, req, res);
      this.recordSuccess(instance);
    } catch (error) {
      this.recordFailure(instance);
      throw error;
    }
  }

  private selectHealthyInstance(service: string): ServiceInstance | null {
    const instances = this.serviceInstances.get(service);
    if (!instances || instances.length === 0) {
      return null;
    }

    // Check for half-open circuits
    this.checkCircuitStates(instances);

    // Filter healthy instances
    const healthyInstances = instances.filter(i =>
      i.healthy && (i.circuitState === 'closed' || i.circuitState === 'half-open')
    );

    if (healthyInstances.length === 0) {
      return null;
    }

    // Round-robin load balancing
    const currentIdx = this.currentIndex.get(service) || 0;
    const selectedInstance = healthyInstances[currentIdx % healthyInstances.length];

    // Update index for next request
    this.currentIndex.set(service, (currentIdx + 1) % healthyInstances.length);

    return selectedInstance;
  }

  private checkCircuitStates(instances: ServiceInstance[]) {
    const now = Date.now();

    for (const instance of instances) {
      if (instance.circuitState === 'open' && instance.lastFailureTime) {
        if (now - instance.lastFailureTime >= this.CIRCUIT_TIMEOUT) {
          this.logger.log(`Circuit transitioning to half-open for ${instance.url}`);
          instance.circuitState = 'half-open';
          instance.successCount = 0;
        }
      }
    }
  }

  private recordSuccess(instance: ServiceInstance) {
    if (instance.circuitState === 'half-open') {
      instance.successCount++;
      if (instance.successCount >= this.SUCCESS_THRESHOLD) {
        this.logger.log(`Circuit closing for ${instance.url} after ${instance.successCount} successful requests`);
        instance.circuitState = 'closed';
        instance.failures = 0;
        instance.successCount = 0;
      }
    } else if (instance.circuitState === 'closed') {
      instance.failures = 0;
    }
  }

  private recordFailure(instance: ServiceInstance) {
    instance.failures++;
    instance.lastFailureTime = Date.now();

    if (instance.circuitState === 'closed' && instance.failures >= this.FAILURE_THRESHOLD) {
      this.logger.error(`Circuit opening for ${instance.url} after ${instance.failures} consecutive failures`);
      instance.circuitState = 'open';
      instance.healthy = false;
    } else if (instance.circuitState === 'half-open') {
      this.logger.error(`Circuit reopening for ${instance.url} - failed during half-open state`);
      instance.circuitState = 'open';
      instance.healthy = false;
    }
  }

  private async performProxyRequest(
    instance: ServiceInstance,
    req: Request,
    res: Response,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetUrl = instance.url;
      const url = new URL(req.url, targetUrl);

      const headers = this.filterHeaders(req.headers, url.host);

      let body: string | Buffer | undefined;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (req.body) {
          if (typeof req.body === 'object') {
            body = JSON.stringify(req.body);
            headers['content-type'] = 'application/json';
            headers['content-length'] = Buffer.byteLength(body).toString();
          } else {
            body = req.body;
            headers['content-length'] = Buffer.byteLength(body).toString();
          }
        }
      }

      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: req.method,
        headers,
        timeout: 30000,
      };

      this.logger.debug(`Proxying ${req.method} ${req.url} -> ${url.href}`);

      const proxyReq = (url.protocol === 'https:' ? https : http).request(
        options,
        (proxyRes) => {
          res.status(proxyRes.statusCode || 200);

          Object.keys(proxyRes.headers).forEach(key => {
            const value = proxyRes.headers[key];
            if (value && !this.headersToRemove.includes(key.toLowerCase())) {
              res.setHeader(key, value);
            }
          });

          proxyRes.pipe(res);
          proxyRes.on('end', () => resolve());
        }
      );

      proxyReq.on('timeout', () => {
        this.logger.error(`Proxy timeout for ${instance.url}`);
        proxyReq.destroy();
        if (!res.headersSent) {
          res.status(504).json({
            error: 'Gateway Timeout',
            message: 'The request timed out. Please try again later.'
          });
        }
        reject(new Error('Timeout'));
      });

      proxyReq.on('error', (err) => {
        this.logger.error(`Proxy error for ${instance.url}: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Proxy error', details: err.message });
        }
        reject(err);
      });

      if (body) {
        proxyReq.write(body);
      }
      proxyReq.end();
    });
  }

  private filterHeaders(headers: any, targetHost: string): any {
    const filtered: any = {};

    Object.keys(headers).forEach(key => {
      const lowerKey = key.toLowerCase();

      if (this.headersToRemove.includes(lowerKey)) {
        return;
      }

      if (lowerKey === 'content-length') {
        return;
      }

      filtered[key] = headers[key];
    });

    filtered['host'] = targetHost;

    return filtered;
  }

  async checkServiceHealth(service: string, instanceUrl?: string): Promise<boolean> {
    const instances = this.serviceInstances.get(service);
    if (!instances) {
      return false;
    }

    // Check specific instance or all instances
    const instancesToCheck = instanceUrl
      ? instances.filter(i => i.url === instanceUrl)
      : instances;

    for (const instance of instancesToCheck) {
      try {
        const url = new URL('/health', instance.url);
        const isHealthy = await this.performHealthCheck(url.href);

        if (isHealthy) {
          instance.healthy = true;
          if (instance.circuitState === 'open') {
            instance.circuitState = 'half-open';
            instance.successCount = 0;
          }
        } else {
          instance.healthy = false;
        }
      } catch (error) {
        instance.healthy = false;
        this.logger.error(`Health check failed for ${instance.url}: ${error.message}`);
      }
    }

    return instancesToCheck.some(i => i.healthy);
  }

  private performHealthCheck(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const options: http.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'GET',
        timeout: 5000,
      };

      const req = (urlObj.protocol === 'https:' ? https : http).request(
        options,
        (res) => {
          resolve(res.statusCode === 200);
          res.resume(); // Consume response data
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.end();
    });
  }

  getServiceInstances(service: string): ServiceInstance[] {
    return this.serviceInstances.get(service) || [];
  }

  getAllServices(): string[] {
    return Array.from(this.serviceInstances.keys());
  }
}
