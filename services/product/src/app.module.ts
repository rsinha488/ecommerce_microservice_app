import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import productConfig, { validationSchema } from './config/product.config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from './application/product.module';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './presentation/health/health.controller';
console.log('Connecting to MongoDB at:', process.env.MONGO_URI);
@Module({
  imports: [
    // ✅ Global config (environment variables + schema validation)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [productConfig],
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`],
      validationSchema: validationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),

    // ✅ Database connection at service-root level (DDD rule)
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/products-service'),

    // ✅ Product bounded-context module
    ProductModule,
    
    // ✅ Health check module
    TerminusModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
