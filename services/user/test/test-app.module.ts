import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { RedisModule } from './__mocks__/redis.module';
import { MongoMemoryServer } from 'mongodb-memory-server';

@Module({
  imports: [
    // ✅ InMemory Mongo for Testing
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const mongo = await MongoMemoryServer.create();
        return { uri: mongo.getUri() };
      },
    }),

    // ✅ Mock Redis (replaces real RedisModule)
    RedisModule,

    // ✅ Load the actual application logic
    AppModule,
  ],
})
export class TestAppModule {}
