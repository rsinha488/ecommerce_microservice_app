import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
  }));

  // Cookie parser for session management
  app.use(cookieParser());

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('E-Commerce Microservices API Gateway')
    .setDescription('API Gateway for E-Commerce Microservices with Authentication, Products, Orders, and more')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('products', 'Product management')
    .addTag('orders', 'Order management')
    .addTag('users', 'User management')
    .addTag('health', 'Health check endpoints')
    .addTag('gateway', 'Gateway-specific endpoints')
    .addServer('http://localhost:3008', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1f2937 }
    `,
    customSiteTitle: 'E-Commerce API Gateway Documentation',
  });

  const port = process.env.GATEWAY_PORT ? Number(process.env.GATEWAY_PORT) : 3008;
  await app.listen(port);
  Logger.log(`API Gateway listening on ${port}`, 'Bootstrap');
  Logger.log(`Swagger documentation available at http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();
