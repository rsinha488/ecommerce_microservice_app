import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

/**
 * Bootstrap the Real-time WebSocket Service
 *
 * This service provides real-time updates for:
 * - Order status changes
 * - Inventory updates
 * - User notifications
 * - Admin dashboard updates
 */
async function bootstrap() {
  const logger = new Logger('RealTimeService');
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
  });

  // Security middleware
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('E-Commerce Real-Time Service API')
    .setDescription(
      `Real-time WebSocket service for live updates and notifications.

      ## Features
      - WebSocket connections for real-time updates
      - Order status notifications
      - Inventory change broadcasts
      - Admin dashboard live updates
      - User-specific notification channels

      ## WebSocket Events

      ### Client -> Server
      - \`subscribe:orders\` - Subscribe to order updates
      - \`subscribe:inventory\` - Subscribe to inventory updates
      - \`subscribe:notifications\` - Subscribe to user notifications

      ### Server -> Client
      - \`order:created\` - New order created
      - \`order:updated\` - Order status changed
      - \`order:cancelled\` - Order cancelled
      - \`inventory:updated\` - Stock level changed
      - \`notification\` - User notification

      ## Connection
      \`\`\`javascript
      const socket = io('http://localhost:3009', {
        query: {
          userId: 'user-id',
          token: 'auth-token'
        }
      });
      \`\`\`
      `,
    )
    .setVersion('1.0')
    .addTag('realtime', 'Real-time WebSocket operations')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Real-Time Service API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.REALTIME_PORT || 3009;
  await app.listen(port);

  logger.log(`🚀 Real-Time Service is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔌 WebSocket Server: ws://localhost:${port}`);
  logger.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Real-Time Service:', error);
  process.exit(1);
});
