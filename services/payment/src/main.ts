import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // RAW BODY REQUIRED FOR STRIPE WEBHOOK
  app.use('/payment/webhook', bodyParser.raw({ type: 'application/json' }));
  // PARSE OTHER REQUESTS AS JSON
  app.use(bodyParser.json());


  await app.listen(process.env.PORT || 5005);
  console.log(`✅ Payment Service running on port ${process.env.PORT}`);
}
bootstrap();
