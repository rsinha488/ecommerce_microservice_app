import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  
  private readonly serviceUrls = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4000',
    user: process.env.USER_SERVICE_URL || 'http://user-service:3001',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3003',
    order: process.env.ORDER_SERVICE_URL || 'http://order-service:5003',
  };

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

  async proxyRequest(service: string, req: Request, res: Response): Promise<void> {
    console.log(`Proxying request to service: ${service}`);
    const targetUrl = this.serviceUrls[service];

    if (!targetUrl) {
      res.status(500).json({ error: 'Service not configured' });
      return;
    }

    // Build target URL
    const url = new URL(req.url, targetUrl);
    
    // Filter headers
    const headers = this.filterHeaders(req.headers, url.host);
    
    // Prepare request body
    let body: string | Buffer | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body) {
        // Body has been parsed by middleware
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
      timeout: 30000, // 30 seconds timeout
    };

    console.log(`Proxying ${JSON.stringify(options)}`);
    this.logger.debug(`Proxying ${req.method} ${req.url} -> ${url.href}`);

    const proxyReq = (url.protocol === 'https:' ? https : http).request(
      options,
      (proxyRes) => {
        // Copy status
        res.status(proxyRes.statusCode || 200);

        // Copy headers (except connection-related ones)
        Object.keys(proxyRes.headers).forEach(key => {
          const value = proxyRes.headers[key];
          if (value && !this.headersToRemove.includes(key.toLowerCase())) {
            res.setHeader(key, value);
          }
        });

        // Pipe response
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('timeout', () => {
      this.logger.error(`Proxy timeout for ${service}: Request timed out after 30 seconds`);
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ 
          error: 'Gateway Timeout', 
          message: 'The request timed out. Please try again later.' 
        });
      }
    });

    proxyReq.on('error', (err) => {
      this.logger.error(`Proxy error for ${service}: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Proxy error', details: err.message });
      }
    });

    // Write body and end request
    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  }

  private filterHeaders(headers: any, targetHost: string): any {
    const filtered: any = {};
    
    Object.keys(headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      
      // Skip headers that shouldn't be forwarded
      if (this.headersToRemove.includes(lowerKey)) {
        return;
      }
// Skip content-length (we'll set it properly)
      if (lowerKey === 'content-length') {
        return;
      }
      
      filtered[key] = headers[key];
    });
    
    // Set the correct host header
    filtered['host'] = targetHost;
    
    return filtered;
  }
}