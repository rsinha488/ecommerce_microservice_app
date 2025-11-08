import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import userConfig from './config/user.config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from './infrastructure/redis/redis.module';


import { UserController } from './presentation/controllers/user.controller';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { UserMapper } from './infrastructure/mappers/user.mapper';
import { UserDomainService } from './domain/services/user-domain.service';


import { CreateUserUseCase } from './application/use-cases/create-user.usecase';
import { UpdateUserUseCase } from './application/use-cases/update-user.usecase';
import { GetUserUseCase } from './application/use-cases/get-user.usecase';
import { ListUsersUseCase } from './application/use-cases/list-users.usecase';


import { UserModel, UserSchema } from './infrastructure/database/user.schema';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [userConfig] }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }]),
    RedisModule,
  ],
  controllers: [UserController],
  providers: [
    {
      provide: "USER_REPOSITORY",
      useClass: UserRepository,
    },

    UserMapper,
    UserDomainService,
    CreateUserUseCase,
    UpdateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
  ], exports: [CreateUserUseCase, GetUserUseCase, ListUsersUseCase],
})
export class AppModule { }