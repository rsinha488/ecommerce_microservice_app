import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import orderConfig from './config/order.config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';

import { OrderController } from './presentation/controllers/order.controller';

import { OrderRepository } from './infrastructure/repositories/order.repository';
import { OrderMapper } from './infrastructure/mappers/order.mapper';
import { OrderProducer } from './infrastructure/events/order.producer';
import { OrderSchema, OrderModel } from './infrastructure/database/order.schema';

import { OrderDomainService } from './domain/services/order-domain.service';
import { OrderFactory } from './domain/factories/order.factory';
import { CreateOrderUseCase } from './application/use-cases/create-order.usecase';
import { GetOrderUseCase } from './application/use-cases/get-order.usecase';
import { ListOrdersUseCase } from './application/use-cases/list-orders.usecase';
import { ORDER_REPOSITORY } from './domain/interfaces/order-repository.interface';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: (() => {
        const env = process.env.NODE_ENV;

        if (env === 'production') return '.env.production';
        if (env === 'local') return '.env.local';

        return '.env'; // default fallback
      })(),
    }),

    MongooseModule.forRoot(process.env.MONGO_URI!),

    MongooseModule.forFeature([
      { name: OrderModel.name, schema: OrderSchema },
    ]),

    EventBusModule,        // Event bus 
  ],
  controllers: [OrderController],

  providers: [
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepository,
    },

    OrderMapper,
    OrderProducer,

    OrderDomainService,
    OrderFactory,

    CreateOrderUseCase,
    GetOrderUseCase,
    ListOrdersUseCase,
  ],

  exports: [
    CreateOrderUseCase,
    GetOrderUseCase,
    ListOrdersUseCase,
  ],
})
export class AppModule { }
