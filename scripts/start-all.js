#!/usr/bin/env node
/**
 * Node.js Script to Start All E-commerce Microservices
 * Usage: node scripts/start-all.js or npm run start:all
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment configuration
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Default configuration if .env doesn't exist
const config = {
  MONGO_URI_USER: process.env.MONGO_URI_USER || 'mongodb+srv://ruchishestabit_db_user:39763976@cluster0.ejp03r8.mongodb.net/user-service',
  MONGO_URI_PRODUCT: process.env.MONGO_URI_PRODUCT || 'mongodb+srv://ruchishestabit_db_user:39763976@cluster0.ejp03r8.mongodb.net/product-service',
  MONGO_URI_INVENTORY: process.env.MONGO_URI_INVENTORY || 'mongodb+srv://ruchishestabit_db_user:39763976@cluster0.ejp03r8.mongodb.net/inventory-service',
  MONGO_URI_AUTH: process.env.MONGO_URI_AUTH || 'mongodb+srv://ruchishestabit_db_user:39763976@cluster0.ejp03r8.mongodb.net/auth-service',
  MONGO_URI_ORDER: process.env.MONGO_URI_ORDER || 'mongodb+srv://ruchishestabit_db_user:39763976@cluster0.ejp03r8.mongodb.net/order-service',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  KAFKA_BROKERS: process.env.KAFKA_BROKERS || 'localhost:9092',
  KAFKA_BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
  ELASTICSEARCH_NODE: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  PORT_USER: process.env.PORT_USER || '3001',
  PORT_PRODUCT: process.env.PORT_PRODUCT || '3002',
  PORT_INVENTORY: process.env.PORT_INVENTORY || '3003',
  PORT_AUTH: process.env.PORT_AUTH || '4000',
  PORT_ORDER: process.env.PORT_ORDER || '5003',
  JWT_ISS: process.env.JWT_ISS || 'http://localhost:4000',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
  log('=====================================', colors.cyan);
  log(message, colors.cyan);
  log('=====================================', colors.cyan);
  console.log();
}

async function checkDocker() {
  return new Promise((resolve) => {
    exec('docker ps', (error) => {
      if (error) {
        log('✗ Docker is not running. Please start Docker first.', colors.red);
        process.exit(1);
      }
      log('✓ Docker is running', colors.green);
      resolve();
    });
  });
}

async function startInfrastructure() {
  log('Starting infrastructure services (Redis, Kafka)...', colors.yellow);
  
  return new Promise((resolve, reject) => {
    const dockerCompose = spawn('docker-compose', ['up', '-d'], {
      cwd: path.join(__dirname, '../services/inventory'),
      shell: true,
    });

    dockerCompose.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`docker-compose exited with code ${code}`));
      } else {
        log('✓ Infrastructure services started', colors.green);
        log('  - Redis: localhost:6379', colors.gray);
        log('  - Kafka: localhost:9092', colors.gray);
        log('  - Kafka UI: http://localhost:8080', colors.gray);
        console.log();
        log('Using MongoDB Atlas (cloud database)', colors.cyan);
        log('  - Connection: cluster0.ejp03r8.mongodb.net', colors.gray);
        console.log();
        resolve();
      }
    });
  });
}

function startService(serviceName, servicePath, envVars, port) {
  log(`Starting ${serviceName} on port ${port}...`, colors.cyan);

  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'npm.cmd' : 'npm';

  const service = spawn(command, ['run', 'start:dev'], {
    cwd: path.join(__dirname, '..', servicePath),
    env: { ...process.env, ...envVars },
    stdio: 'inherit',
    shell: true,
  });

  service.on('error', (err) => {
    log(`✗ Failed to start ${serviceName}: ${err.message}`, colors.red);
  });

  log(`✓ ${serviceName} started`, colors.green);
  
  return service;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  header('E-commerce Microservices Starter');

  log('Loading configuration...', colors.yellow);
  log('MongoDB Atlas URI configured', colors.green);
  console.log();

  // Check Docker
  log('Checking Docker status...', colors.yellow);
  await checkDocker();
  console.log();

  // Start infrastructure
  await startInfrastructure();
  
  log('Waiting 10 seconds for services to initialize...', colors.yellow);
  await sleep(10000);

  console.log();
  log('Starting microservices...', colors.yellow);
  console.log();

  const services = [];

  // Start Order Service
  services.push(startService(
    'Order Service',
    'services/order',
    {
      MONGO_URI: config.MONGO_URI_ORDER,
      PORT: config.PORT_ORDER,
    },
    config.PORT_ORDER
  ));
  await sleep(2000);

  // Start Product Service
  services.push(startService(
    'Product Service',
    'services/product',
    {
      MONGO_URI: config.MONGO_URI_PRODUCT,
      PORT: config.PORT_PRODUCT,
      KAFKA_BROKERS: config.KAFKA_BROKERS,
      ELASTICSEARCH_NODE: config.ELASTICSEARCH_NODE || 'http://localhost:9200',
    },
    config.PORT_PRODUCT
  ));
  await sleep(2000);

  // Start Inventory Service
  services.push(startService(
    'Inventory Service',
    'services/inventory',
    {
      MONGO_URI: config.MONGO_URI_INVENTORY,
      PORT: config.PORT_INVENTORY,
      KAFKA_BROKER: config.KAFKA_BROKER,
      REDIS_HOST: config.REDIS_HOST,
    },
    config.PORT_INVENTORY
  ));
  await sleep(2000);

  // Start Auth Service
  services.push(startService(
    'Auth Service',
    'services/auth',
    {
      MONGO_URI: config.MONGO_URI_AUTH,
      AUTH_PORT: config.PORT_AUTH,
      REDIS_HOST: config.REDIS_HOST,
      JWT_ISS: config.JWT_ISS,
    },
    config.PORT_AUTH
  ));
  await sleep(2000);

  // Start User Service
  services.push(startService(
    'User Service',
    'services/user',
    {
      MONGO_URI: config.MONGO_URI_USER,
      PORT: config.PORT_USER,
      REDIS_HOST: config.REDIS_HOST,
    },
    config.PORT_USER
  ));

  console.log();
  header('All services are running!');
  console.log();
  log('Database: MongoDB Atlas (Cloud)', colors.cyan);
  log('  cluster0.ejp03r8.mongodb.net', colors.gray);
  console.log();
  log('Access Points:', colors.cyan);
  log(`  • Order API Docs: http://localhost:${config.PORT_ORDER}/docs`);
  log(`  • Product API: http://localhost:${config.PORT_PRODUCT}/api`);
  log(`  • Inventory API: http://localhost:${config.PORT_INVENTORY}/api`);
  log(`  • Auth OIDC: http://localhost:${config.PORT_AUTH}/.well-known/openid-configuration`);
  log(`  • User API: http://localhost:${config.PORT_USER}/users`);
  log('  • Kafka UI: http://localhost:8080');
  console.log();
  log('Press Ctrl+C to stop all services', colors.yellow);
  console.log();

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log();
    log('Shutting down services...', colors.yellow);
    services.forEach(service => service.kill());
    process.exit(0);
  });
}

main().catch((err) => {
  log(`Error: ${err.message}`, colors.red);
  process.exit(1);
});
