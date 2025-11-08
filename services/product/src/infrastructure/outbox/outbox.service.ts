import { Injectable } from '@nestjs/common';

@Injectable()
export class OutboxService {
  async publish(eventType: string, payload: any) {
    // TODO: connect to Kafka or Redis Streams
    console.log(`Outbox event: ${eventType}`, payload);
  }
}
