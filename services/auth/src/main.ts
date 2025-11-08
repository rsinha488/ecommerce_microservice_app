import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.AUTH_PORT ? Number(process.env.AUTH_PORT) : 4000;
  await app.listen(port);
  Logger.log(`Auth service listening on ${port}`, 'Bootstrap');
}
bootstrap();