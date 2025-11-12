# Environment Configuration Guide

## 📁 Configuration Files

Your microservices platform now uses centralized configuration files for all environment variables:

### **For Windows (PowerShell):**
- **File:** `config.env.ps1`
- **Usage:** Automatically loaded by `start-all-services.ps1`

### **For Linux/Mac (Bash):**
- **File:** `config.env.sh`
- **Usage:** Automatically loaded by `start-all-services.sh`

### **For Node.js:**
- **File:** `.env` (create if needed)
- **Usage:** Loaded by `scripts/start-all.js`

---

## 🗄️ MongoDB Configuration

### **Current Setup: MongoDB Atlas (Cloud)**

```
Connection String: mongodb+srv://ruchishestabit_db_user:39763976@cluster0.ejp03r8.mongodb.net
```

**Database Names:**
- `user-service` - User Service data
- `product-service` - Product catalog
- `inventory-service` - Stock and inventory
- `auth-service` - Authentication and authorization
- `order-service` - Orders and transactions

---

## 🔧 How to Change Configuration

### **Method 1: Edit Config Files (Recommended)**

**Windows PowerShell:**
```powershell
notepad config.env.ps1
```

**Linux/Mac:**
```bash
nano config.env.sh
```

### **Method 2: Individual Service Override**

You can override environment variables for specific services by setting them before starting:

**Windows:**
```powershell
$env:MONGO_URI_USER = "mongodb://your-custom-uri"
.\start-all-services.ps1
```

**Linux/Mac:**
```bash
export MONGO_URI_USER="mongodb://your-custom-uri"
./start-all-services.sh
```

---

## 📊 Current Configuration

### **MongoDB URIs:**
```
User Service:      mongodb+srv://...@cluster0.ejp03r8.mongodb.net/user-service
Product Service:   mongodb+srv://...@cluster0.ejp03r8.mongodb.net/product-service
Inventory Service: mongodb+srv://...@cluster0.ejp03r8.mongodb.net/inventory-service
Auth Service:      mongodb+srv://...@cluster0.ejp03r8.mongodb.net/auth-service
Order Service:     mongodb+srv://...@cluster0.ejp03r8.mongodb.net/order-service
```

### **Service Ports:**
```
User Service:      3001
Product Service:   3002
Inventory Service: 3003
Auth Service:      4000
Order Service:     5003
```

### **Infrastructure:**
```
Redis:         localhost:6379
Kafka:         localhost:9092
Kafka UI:      localhost:8080
Zookeeper:     localhost:2181
Elasticsearch: localhost:9200 (optional - default if not running)
```

---

## 🔐 Security Best Practices

### **⚠️ Important Security Notes:**

1. **Don't Commit Credentials**
   - Add `.env` to `.gitignore`
   - Never commit `config.env.ps1` or `config.env.sh` with real credentials

2. **Use Environment-Specific Files**
   ```
   config.env.development.ps1
   config.env.production.ps1
   config.env.staging.ps1
   ```

3. **Rotate Credentials Regularly**
   - Change MongoDB password periodically
   - Update all config files when credentials change

4. **Use Secrets Management**
   - For production: Use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault
   - For development: Use `.env` files (git-ignored)

---

## 🚀 Using Different Environments

### **Development (Current)**
Uses MongoDB Atlas cloud database with config files.

### **Local Development**
To use local MongoDB instead:

1. **Edit `config.env.ps1`:**
```powershell
$env:MONGO_URI_USER = "mongodb://localhost:27017/user-service"
$env:MONGO_URI_PRODUCT = "mongodb://localhost:27017/product-service"
# ... etc
```

2. **Start local MongoDB:**
```powershell
cd services/inventory
docker-compose up -d
```

### **Production**
For production deployments:

1. Create `config.env.production.ps1`
2. Use production MongoDB URI
3. Update security settings
4. Use environment variables from your hosting platform

---

## 📝 Configuration Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI_USER` | User service database | `mongodb+srv://...` |
| `MONGO_URI_PRODUCT` | Product service database | `mongodb+srv://...` |
| `MONGO_URI_INVENTORY` | Inventory service database | `mongodb+srv://...` |
| `MONGO_URI_AUTH` | Auth service database | `mongodb+srv://...` |
| `MONGO_URI_ORDER` | Order service database | `mongodb+srv://...` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `KAFKA_BROKERS` | Kafka broker address | `localhost:9092` |
| `ELASTICSEARCH_NODE` | Elasticsearch node URL | `http://localhost:9200` |
| `PORT_USER` | User service port | `3001` |
| `PORT_PRODUCT` | Product service port | `3002` |
| `PORT_INVENTORY` | Inventory service port | `3003` |
| `PORT_AUTH` | Auth service port | `4000` |
| `PORT_ORDER` | Order service port | `5003` |
| `JWT_ISS` | JWT issuer URL | `http://localhost:4000` |
| `NODE_ENV` | Environment name | `development` |

---

## 🔍 Troubleshooting

### **Connection String Issues**

**Problem:** Can't connect to MongoDB Atlas
```
Error: MongoServerError: bad auth
```

**Solutions:**
1. Check username and password in config files
2. Verify IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for development)
3. Test connection string:
   ```powershell
   mongosh "mongodb+srv://ruchishestabit_db_user:39763976@cluster0.ejp03r8.mongodb.net"
   ```

### **Environment Variables Not Loading**

**Problem:** Services using default values instead of config

**Solutions:**
1. Verify config file exists: `Test-Path config.env.ps1`
2. Check file is being sourced in start script
3. Manually load and test:
   ```powershell
   . .\config.env.ps1
   echo $env:MONGO_URI_USER
   ```

---

## 📚 Examples

### **Switching to Local MongoDB**

```powershell
# Edit config.env.ps1
$env:MONGO_URI_USER = "mongodb://localhost:27017/user-service"
$env:MONGO_URI_PRODUCT = "mongodb://localhost:27017/product-service"
$env:MONGO_URI_INVENTORY = "mongodb://localhost:27017/inventory-service"
$env:MONGO_URI_AUTH = "mongodb://localhost:27017/auth-service"
$env:MONGO_URI_ORDER = "mongodb://localhost:27017/order-service"

# Start local MongoDB in Docker
cd services/inventory
docker-compose up -d mongo

# Start services
.\start-all-services.ps1
```

### **Using Different Ports**

```powershell
# Edit config.env.ps1
$env:PORT_USER = "4001"
$env:PORT_PRODUCT = "4002"
$env:PORT_INVENTORY = "4003"
$env:PORT_AUTH = "4004"
$env:PORT_ORDER = "4005"

# Start services
.\start-all-services.ps1
```

---

## 📞 Quick Commands

```powershell
# View current configuration
. .\config.env.ps1

# Test MongoDB connection
mongosh "$env:MONGO_URI_USER"

# Start with configuration
.\start-all-services.ps1

# Check service status
.\check-services-status.ps1
```

---

**All configuration is now centralized! Edit `config.env.ps1` (Windows) or `config.env.sh` (Linux/Mac) to change any settings.** 🎉

