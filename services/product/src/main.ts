import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

/**
 * Bootstrap function for initializing the Product Service
 *
 * This function sets up:
 * - NestJS application instance with CORS enabled
 * - Security middleware (Helmet)
 * - Winston logger for structured logging
 * - Global validation pipes for DTO validation
 * - Swagger/OpenAPI documentation at /api
 * - Kafka microservice for event-driven communication
 * - Graceful shutdown handling
 */
async function bootstrap() {
  try {
    /**
     * -------------------------------------------------------------
     * ✅ WINSTON LOGGER — Centralized structured logging
     * -------------------------------------------------------------
     * Provides production-ready logging with:
     * - Console output for development (colorized)
     * - File output for error logs
     * - JSON format for log aggregation systems
     * - Timestamp for all log entries
     */
    const winstonLogger = WinstonModule.createLogger({
      transports: [
        // Console logs (dev-friendly with colors)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),

        // Error logs written to file (JSON format for parsing)
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
     * Helmet: Adds security headers to protect against common vulnerabilities
     * - XSS protection
     * - Content type sniffing prevention
     * - Frame options (clickjacking protection)
     * - HSTS (HTTP Strict Transport Security)
     *
     * CORS: Allow cross-origin requests (configure origins in production)
     */
    app.use(helmet({
      contentSecurityPolicy: false, // Disable for development to allow Swagger UI
    }));
    app.enableCors();

    /**
     * -------------------------------------------------------------
     * ✅ GLOBAL VALIDATION PIPE — Protects DTO Inputs
     * -------------------------------------------------------------
     * Automatically validates all incoming requests against DTOs
     * - whitelist: Strip properties not in DTO
     * - forbidNonWhitelisted: Throw error on unknown properties
     * - transform: Auto-convert types (e.g., string "123" → number 123)
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
     * Comprehensive OpenAPI 3.0 documentation for Product Service
     * Access at: http://localhost:3002/api
     * -------------------------------------------------------------
     */
    const swaggerConfig = new DocumentBuilder()
      .setTitle('E-Commerce Product Service API')
      .setDescription(`
# Product Management Service

This service provides comprehensive product management capabilities for the e-commerce microservices platform.

## Features

### 📦 Product Management
- Create products with validation and duplicate detection
- Update product details and inventory
- Fetch single products by ID
- List products with advanced filtering and pagination
- Image upload support (Base64 encoding)

### 🔍 Search & Filtering
- Filter by category
- Search by product name
- Price range filtering (minPrice, maxPrice)
- Pagination support (page, limit)
- Full-text search capabilities

### 📊 Event-Driven Architecture
- Publishes \`product.created\` events to Kafka
- Publishes \`product.updated\` events to Kafka
- Inventory Service consumes events for stock synchronization
- Transactional outbox pattern for reliability

### 🛡️ Data Integrity
- SKU uniqueness validation
- Price and stock validation
- MongoDB indexes for performance
- Elasticsearch integration for search

## Error Handling

All endpoints return standardized error responses with specific error codes:

### Product Error Codes (PROD00X)
- **PROD001**: Product not found (404)
- **PROD002**: Product already exists / Duplicate SKU (409)
- **PROD003**: Invalid product data / Validation failed (400)
- **PROD004**: Invalid filter parameters (400)
- **PROD005**: Product creation failed (500)
- **PROD006**: Product update failed (500)
- **PROD007**: Kafka event publish failed (503)
- **PROD008**: Database operation failed (500)

## Getting Started

1. **Create a product**: \`POST /products\`
2. **List products**: \`GET /products\`
3. **Get single product**: \`GET /products/:id\`
4. **Update product**: \`PUT /products/:id\`

## Integration

This service integrates with:
- **Inventory Service**: Stock synchronization via Kafka
- **Order Service**: Product validation for orders
- **Gateway Service**: API aggregation and routing

For detailed error handling documentation, see ERROR_HANDLING_GUIDE.md
      `)
      .setVersion('1.0.0')
      .setContact(
        'Product Service Team',
        'https://github.com/your-org/ecom-microservices',
        'product-team@example.com'
      )
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer('http://localhost:3002', 'Local Development Server')
      .addServer('http://product-service:3002', 'Docker Internal Network')
      .addServer('https://api.example.com/products', 'Production Server')
      .addTag('Products', 'Product management endpoints (CRUD operations)')
      .addTag('Health', 'Health check and monitoring endpoints')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'JWT access token obtained from Auth Service',
          in: 'header',
        },
        'bearer'
      )
      .addGlobalParameters({
        name: 'X-Request-ID',
        in: 'header',
        required: false,
        description: 'Unique request identifier for distributed tracing',
        schema: { type: 'string', example: 'req-prod-123-456' }
      })
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    });

    // Setup Swagger UI at /api endpoint
    SwaggerModule.setup('api', app, document, {
      customSiteTitle: 'Product Service API Documentation',
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { font-size: 2.5rem; color: #333; }
      `,
      swaggerOptions: {
        persistAuthorization: true, // Keep authorization data after page refresh
        displayRequestDuration: true, // Show request duration
        filter: true, // Enable filtering operations
        tryItOutEnabled: true, // Enable "Try it out" by default
        syntaxHighlight: {
          activate: true,
          theme: 'monokai'
        },
        docExpansion: 'list', // Expand/collapse operations: 'list', 'full', or 'none'
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
        tagsSorter: 'alpha', // Sort tags alphabetically
        operationsSorter: 'alpha', // Sort operations alphabetically
      },
    });

    /**
     * -------------------------------------------------------------
     * ✅ KAFKA MICROSERVICE CONFIGURATION
     * -------------------------------------------------------------
     * This allows Product Service to:
     *  - Publish "product.created" events
     *  - Publish "product.updated" events
     *  - Publish "stock.adjust" events
     *
     * Inventory service will consume these events
     * and update inventory automatically.
     * -------------------------------------------------------------
     */
    const kafkaBrokers = process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || 'localhost:9092';
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: process.env.KAFKA_CLIENT_ID || 'product-service',
          brokers: kafkaBrokers.split(','),
        },
        consumer: {
          groupId: process.env.KAFKA_GROUP_ID || 'product-consumer-group',
        },
      },
    });

    await app.startAllMicroservices();
    winstonLogger.log('✅ Kafka connected for Product Service');

    /**
     * -------------------------------------------------------------
     * ✅ START HTTP SERVER
     * -------------------------------------------------------------
     */
    const port = configService.get<number>('product.port') || 3002;
    await app.listen(port);

    const bootstrapLogger = new Logger('Bootstrap');
    bootstrapLogger.log(`🚀 Product Service started successfully`);
    bootstrapLogger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    bootstrapLogger.log(`🌐 Server listening on: http://localhost:${port}`);
    bootstrapLogger.log(`📚 Swagger API Documentation: http://localhost:${port}/api`);
    bootstrapLogger.log(`📡 Kafka Producers ready → Inventory Service will sync automatically`);
    bootstrapLogger.log(``);
    bootstrapLogger.log(`📖 Available Endpoints:`);
    bootstrapLogger.log(`   - POST   /products           - Create new product`);
    bootstrapLogger.log(`   - GET    /products           - List all products (with filters)`);
    bootstrapLogger.log(`   - GET    /products/:id       - Get single product`);
    bootstrapLogger.log(`   - PUT    /products/:id       - Update product`);
    bootstrapLogger.log(`   - GET    /health             - Health check`);
    bootstrapLogger.log(``);

    /**
     * -------------------------------------------------------------
     * ✅ GRACEFUL SHUTDOWN HANDLING
     * -------------------------------------------------------------
     * Ensures clean shutdown on SIGINT (Ctrl+C) or SIGTERM
     * - Closes all database connections
     * - Flushes Kafka producers
     * - Completes in-flight requests
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
 * Catches any unhandled promise rejections or uncaught exceptions
 * to prevent silent failures
 */
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

bootstrap().catch(err => {
  console.error(`❌ Failed to start Product Service: ${err.message}`, err.stack);
  process.exit(1);
});
