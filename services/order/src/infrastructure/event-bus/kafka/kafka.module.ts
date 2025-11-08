import { Global, Module } from '@nestjs/common';
import { KafkaProducer } from './kafka.producer';
import { KafkaConsumer } from './kafka.consumer';
import { KafkaConfig } from './kafka.config';

@Global()
@Module({
  providers: [KafkaProducer, KafkaConsumer, KafkaConfig],
  exports: [KafkaProducer, KafkaConsumer],
})
export class KafkaModule {}
