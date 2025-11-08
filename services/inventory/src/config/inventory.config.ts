export default () => ({
  port: parseInt(process.env.INVENTORY_PORT || '4010', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/inventory',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  kafkaBrokers: (process.env.KAFKA_BROKER || 'localhost:9092').split(','),
});
