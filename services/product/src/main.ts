import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  try {
    /**
     * -------------------------------------------------------------
     * ✅ WINSTON LOGGER — Centralized structured logging
     * -------------------------------------------------------------
     */
    const winstonLogger = WinstonModule.createLogger({
      transports: [
        // Console logs (dev-friendly)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),

        // Error logs written to file
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    });

    /**
     * -------------------------------------------------------------
     * ✅ CREATE NEST APPLICATION WITH WINSTON LOGGER
     * -------------------------------------------------------------
     */
    const app = await NestFactory.create(AppModule, {
      logger: winstonLogger,
    });

    const configService = app.get(ConfigService);

    /**
     * -------------------------------------------------------------
     * ✅ SECURITY — Helmet + CORS
     * -------------------------------------------------------------
     */
    app.use(helmet());
    app.enableCors();

    /**
     * -------------------------------------------------------------
     * ✅ GLOBAL VALIDATION PIPE — Protects DTO Inputs
     * -------------------------------------------------------------
     */
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // strips unknown fields
        forbidNonWhitelisted: true, // throw error on extra fields
        transform: true, // converts payload → DTO classes
      })
    );

    /**
     * -------------------------------------------------------------
     * ✅ SWAGGER API DOCUMENTATION CONFIG
     * -------------------------------------------------------------
     */
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Product Service API')
      .setDescription('API documentation for Product microservice')
      .setVersion('1.0')
      .addTag('products')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);

    /**
     * -------------------------------------------------------------
     * ✅ KAFKA MICROservice CONFIGURATION
     * -------------------------------------------------------------
     * This allows Product Service to:
     *  - Publish "product_created" events
     *  - Publish "product_updated" events
     *  - Publish "stock_adjust" events
     * 
     * Inventory service will consume these events
     * and update inventory automatically.
     * -------------------------------------------------------------
     */
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'product-service',
          brokers: ['localhost:9092'], // load from .env later
        },
        consumer: {
          groupId: 'product-consumer-group',
        },
      },
    });

    await app.startAllMicroservices();
    winstonLogger.log('info', '✅ Kafka connected for Product Service');

    /**
     * -------------------------------------------------------------
     * ✅ START HTTP SERVER
     * -------------------------------------------------------------
     */
    const port = configService.get<number>('product.port') || 3002;
    await app.listen(port);

    const bootstrapLogger = new Logger('Bootstrap');
    bootstrapLogger.log(`🚀 Product service running on port ${port}`);
    bootstrapLogger.log(
      `📘 Swagger documentation available at http://localhost:${port}/api`
    );
    bootstrapLogger.log(
      `📡 Kafka Producers ready → Inventory Service will sync automatically`
    );

    /**
     * -------------------------------------------------------------
     * ✅ GRACEFUL SHUTDOWN HANDLING
     * -------------------------------------------------------------
     */
    process.on('SIGINT', async () => {
      winstonLogger.warn('🛑 SIGINT received — shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      winstonLogger.warn('🛑 SIGTERM received — shutting down gracefully...');
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    /**
     * -------------------------------------------------------------
     * ❌ BOOTSTRAP FAILURE HANDLING
     * -------------------------------------------------------------
     */
    console.error('❌ Fatal startup error:', error);
    process.exit(1);
  }
}

/**
 * -------------------------------------------------------------
 * ✅ UNHANDLED EXCEPTION SAFETY NET
 * -------------------------------------------------------------
 */
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();
