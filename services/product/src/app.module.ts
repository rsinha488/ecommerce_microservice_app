import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import productConfig, { validationSchema } from './config/product.config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from './application/product.module';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './presentation/health/health.controller';

@Module({
  imports: [
    // ✅ Global config (environment variables + schema validation)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [productConfig],
      envFilePath: ['.env'],
      validationSchema: validationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),

    // ✅ Database connection at service-root level (DDD rule)
    MongooseModule.forRoot(process.env.MONGO_URI!, {
      dbName: process.env.PRODUCT_DB_NAME || 'products_db',
    }),

    // ✅ Product bounded-context module
    ProductModule,
    
    // ✅ Health check module
    TerminusModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
