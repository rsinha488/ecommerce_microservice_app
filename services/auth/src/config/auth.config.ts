export default () => ({
  authPort: parseInt(process.env.AUTH_PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/auth',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwt: {
    issuer: process.env.JWT_ISS || 'http://localhost:4000',
    accessTokenExpiresIn: process.env.ACCESS_EXPIRES || '15m',
    refreshTokenExpiresIn: process.env.REFRESH_EXPIRES || '30d',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKER || 'localhost:9092').split(','),
  },
});
