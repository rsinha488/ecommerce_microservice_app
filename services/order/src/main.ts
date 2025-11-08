import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  });


  // ✅ Global Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // ✅ Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Order Service API')
    .setDescription('API documentation for the Order microservice')
    .setVersion('1.0')
    .addBearerAuth()          // ✅ JWT authentication
    .addTag('orders')         // ✅ Groups APIs
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // ✅ Swagger UI available at /docs
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 5003;
  await app.listen(port);

  Logger.log(`Order service listening on ${port}`, 'Bootstrap');
  Logger.log(`Swagger docs available at http://localhost:${port}/docs`, 'Swagger');
}

bootstrap();
