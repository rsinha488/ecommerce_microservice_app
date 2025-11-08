import { Module } from '@nestjs/common';

@Module({
  providers: [
    {
      provide: 'RedisService',
      useValue: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        quit: jest.fn(),
      },
    },
  ],
  exports: ['RedisService'],
})
export class RedisModule {}
