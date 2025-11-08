import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { KafkaConfig } from './kafka.config';

@Injectable()
export class KafkaConsumer implements OnModuleInit {
    private logger = new Logger(KafkaConsumer.name);
    private consumer: Consumer;

    constructor(private readonly config: KafkaConfig) { }

    async onModuleInit() {
        const kafka = new Kafka({
            brokers: this.config.getBrokers(),
            clientId: 'order-service',
        });

        this.consumer = kafka.consumer({
            groupId: this.config.getGroupId(),
        });

        await this.consumer.connect();
        this.logger.log('✅ Kafka Consumer connected');
    }

    async subscribe(topic: string, handler: (data: any) => Promise<void>) {
        await this.consumer.subscribe({ topic });

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (!message.value) {
                    this.logger.warn('⚠️ Empty Kafka message received. Skipping.');
                    return;
                }

                let event;
                try {
                    event = JSON.parse(message.value.toString());
                } catch (err) {
                    this.logger.error('❌ Invalid Kafka message JSON', {
                        raw: message.value.toString(),
                        error: err.message,
                    });
                    return;
                }

                this.logger.log(`📥 Event received: ${event.event}`);

                // ✅ Continue with your event handling
                
            }

        });

        this.logger.log(`✅ Subscribed to Kafka topic: ${topic}`);
    }
}
