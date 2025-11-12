import {
  Controller,
  All,
  Req,
  Res,
  Next,
  Param,
  Query,
  Body,
  Headers,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('gateway')
@Controller()
@UseGuards(ThrottlerGuard)
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('auth/*')
  @ApiOperation({
    summary: 'Proxy authentication requests',
    description: 'Routes authentication requests to the auth service'
  })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  async proxyAuth(
    @Req() req: Request,
    @Res() res: Response,
    @Param() params: any,
    @Query() query: any,
    @Body() body: any,
    @Headers() headers: any,
  ) {
    console.log('Proxying auth request:', req.method, req.url);
    return this.proxyService.proxyRequest('auth', req, res);
  }

  @All('user/*')
  @ApiOperation({
    summary: 'Proxy user management requests',
    description: 'Routes user management requests to the user service'
  })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  async proxyUser(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyService.proxyRequest('user', req, res);
  }

  @All('product/*')
  @ApiOperation({
    summary: 'Proxy product management requests',
    description: 'Routes product management requests to the product service'
  })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  async proxyProduct(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyService.proxyRequest('product', req, res);
  }

  @All('inventory/*')
  @ApiOperation({
    summary: 'Proxy inventory management requests',
    description: 'Routes inventory management requests to the inventory service'
  })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  async proxyInventory(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log('Proxying inventory request:', req.method, req.url);
    return this.proxyService.proxyRequest('inventory', req, res);
  }

  @All('order/*')
  @ApiOperation({
    summary: 'Proxy order management requests',
    description: 'Routes order management requests to the order service'
  })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  async proxyOrder(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyService.proxyRequest('order', req, res);
  }

  // Handle OIDC endpoints without prefix
  @All('.well-known/*')
  @ApiOperation({
    summary: 'Proxy OIDC discovery requests',
    description: 'Routes OIDC discovery requests to the auth service'
  })
  async proxyWellKnown(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyService.proxyRequest('auth', req, res);
  }

  @All('authorize')
  @ApiOperation({
    summary: 'Proxy OAuth2 authorization requests',
    description: 'Routes OAuth2 authorization requests to the auth service'
  })
  async proxyAuthorize(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyService.proxyRequest('auth', req, res);
  }

  @All('token')
  @ApiOperation({
    summary: 'Proxy OAuth2 token requests',
    description: 'Routes OAuth2 token requests to the auth service'
  })
  async proxyToken(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyService.proxyRequest('auth', req, res);
  }

  @All('userinfo')
  @ApiOperation({
    summary: 'Proxy OAuth2 userinfo requests',
    description: 'Routes OAuth2 userinfo requests to the auth service'
  })
  async proxyUserinfo(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyService.proxyRequest('auth', req, res);
  }

  @All('introspect')
  @ApiOperation({
    summary: 'Proxy OAuth2 token introspection requests',
    description: 'Routes OAuth2 token introspection requests to the auth service'
  })
  async proxyIntrospect(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyService.proxyRequest('auth', req, res);
  }

  @All('revoke')
  @ApiOperation({
    summary: 'Proxy OAuth2 token revocation requests',
    description: 'Routes OAuth2 token revocation requests to the auth service'
  })
  async proxyRevoke(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyService.proxyRequest('auth', req, res);
  }
}
