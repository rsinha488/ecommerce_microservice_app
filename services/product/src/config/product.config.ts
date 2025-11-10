import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3002),
  MONGO_URI: Joi.string().required().default('mongodb://localhost:27017/product-service'),
  PRODUCT_DB_NAME: Joi.string().default('product-service'),
  KAFKA_BROKERS: Joi.string().required(),
  ELASTICSEARCH_NODE: Joi.string().optional().default('http://localhost:9200'),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});

export default registerAs('product', () => ({
  port: parseInt(process.env.PORT || '3002', 10),
  database: {
    uri: process.env.MONGO_URI,
    name: process.env.PRODUCT_DB_NAME || 'product-service',
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  },
  environment: process.env.NODE_ENV || 'development',
}));