import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';


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

  const port = process.env.AUTH_PORT ? Number(process.env.AUTH_PORT) : 4000;
  await app.listen(port, '::');
  Logger.log(`Auth service listening on ${port}`, 'Bootstrap');
  Logger.log(`OpenID Discovery: http://localhost:${port}/.well-known/openid-configuration`, 'Bootstrap');
}
bootstrap();