# MongoDB Atlas Configuration ✅

## ✨ What Was Configured

Your microservices platform now uses **MongoDB Atlas** (cloud database) instead of local MongoDB!

### **MongoDB Atlas Connection:**
```
URI: mongodb+srv://ruchishestabit_db_user:39763976@cluster0.ejp03r8.mongodb.net
Cluster: cluster0.ejp03r8.mongodb.net
```

### **Databases Created:**
- `user-service` - User management and profiles
- `product-service` - Product catalog and inventory
- `inventory-service` - Stock tracking
- `auth-service` - Authentication data
- `order-service` - Order processing

---

## 📁 Configuration Files Created

### **1. config.env.ps1** (Windows PowerShell)
Central configuration file for all environment variables on Windows.

**Location:** `config.env.ps1`

**Usage:**
```powershell
# Automatically loaded when running:
.\start-all-services.ps1
```

### **2. config.env.sh** (Linux/Mac Bash)
Central configuration file for Linux/Mac systems.

**Location:** `config.env.sh`

**Usage:**
```bash
chmod +x config.env.sh
./start-all-services.sh
```

### **3. Updated Start Scripts**
All startup scripts now use the centralized configuration:
- `start-all-services.ps1` - Windows PowerShell
- `start-all-services.sh` - Linux/Mac Bash
- `scripts/start-all.js` - Node.js (cross-platform)

---

## 🚀 How to Use

### **Start All Services (MongoDB Atlas):**

**Windows:**
```powershell
.\start-all-services.ps1
```

**Linux/Mac:**
```bash
./start-all-services.sh
```

**Node.js (Any Platform):**
```bash
npm run start:all
```

### **Benefits:**
✅ **No local MongoDB needed** - Uses cloud database  
✅ **Centralized configuration** - Edit one file to change all URIs  
✅ **Automatic loading** - No manual env setup required  
✅ **Same database everywhere** - All services use MongoDB Atlas  

---

## 🔧 Changing MongoDB URI

### **To use a different MongoDB Atlas cluster:**

1. **Edit `config.env.ps1` (Windows):**
```powershell
notepad config.env.ps1

# Change this line:
$env:MONGODB_BASE_URI = "mongodb+srv://YOUR_USER:YOUR_PASS@YOUR_CLUSTER.mongodb.net"

# Update all service URIs:
$env:MONGO_URI_USER = "mongodb+srv://YOUR_USER:YOUR_PASS@YOUR_CLUSTER.mongodb.net/user-service"
# ... etc
```

2. **Edit `config.env.sh` (Linux/Mac):**
```bash
nano config.env.sh

# Change this line:
export MONGODB_BASE_URI="mongodb+srv://YOUR_USER:YOUR_PASS@YOUR_CLUSTER.mongodb.net"
```

3. **Restart services:**
```powershell
.\stop-all-services.ps1
.\start-all-services.ps1
```

---

## 🔄 Switching Between Local and Cloud MongoDB

### **To Use Local MongoDB (Docker):**

1. **Edit `config.env.ps1`:**
```powershell
# Comment out Atlas URIs and use local:
$env:MONGO_URI_USER = "mongodb://localhost:27017/user-service"
$env:MONGO_URI_PRODUCT = "mongodb://localhost:27017/product-service"
$env:MONGO_URI_INVENTORY = "mongodb://localhost:27017/inventory-service"
$env:MONGO_URI_AUTH = "mongodb://localhost:27017/auth-service"
$env:MONGO_URI_ORDER = "mongodb://localhost:27017/order-service"
```

2. **Start local MongoDB:**
```powershell
cd services/inventory
docker-compose up -d mongo
cd ../..
```

3. **Start services:**
```powershell
.\start-all-services.ps1
```

### **To Use MongoDB Atlas (Current Setup):**

Already configured! Just run:
```powershell
.\start-all-services.ps1
```

---

## 📊 Service Endpoints

Once all services are running with MongoDB Atlas:

| Service | Port | Endpoint | Database |
|---------|------|----------|----------|
| User | 3001 | http://localhost:3001/users | user-service |
| Product | 3002 | http://localhost:3002/api | product-service |
| Inventory | 3003 | http://localhost:3003/api | inventory-service |
| Auth | 4000 | http://localhost:4000 | auth-service |
| Order | 5003 | http://localhost:5003/docs | order-service |

---

## 🔐 Security Notes

### **⚠️ Current Setup (Development):**
- MongoDB credentials are in plain text in config files
- Suitable for **development only**

### **🛡️ For Production:**
1. **Use Environment Variables:**
   ```powershell
   $env:MONGO_URI_USER = $env:MONGODB_USER_URI_SECRET
   ```

2. **Use Secrets Management:**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault

3. **IP Whitelist:**
   - Configure MongoDB Atlas to only allow specific IPs
   - Remove 0.0.0.0/0 from whitelist

4. **Rotate Credentials:**
   - Change password regularly
   - Use different credentials per environment

---

## ✅ Verification

### **Check if services are using MongoDB Atlas:**

1. **Check service logs:**
Look for connection messages like:
```
Connected to MongoDB: cluster0.ejp03r8.mongodb.net
```

2. **Check MongoDB Atlas Dashboard:**
- Login to https://cloud.mongodb.com
- View "Network Access" and "Database Access"
- Check "Metrics" for connection activity

3. **Test connection:**
```powershell
# Install MongoDB Shell (mongosh)
# Then test:
mongosh "mongodb+srv://ruchishestabit_db_user:39763976@cluster0.ejp03r8.mongodb.net/user-service"
```

---

## 🐛 Troubleshooting

### **Problem: Can't connect to MongoDB Atlas**

```
MongoServerSelectionError: connection refused
```

**Solutions:**
1. Check internet connection
2. Verify MongoDB Atlas whitelist includes your IP
3. Test connection string:
   ```powershell
   mongosh "mongodb+srv://ruchishestabit_db_user:39763976@cluster0.ejp03r8.mongodb.net"
   ```

### **Problem: Authentication failed**

```
MongoServerError: bad auth
```

**Solutions:**
1. Verify username: `ruchishestabit_db_user`
2. Verify password: `39763976`
3. Check MongoDB Atlas "Database Access" settings

### **Problem: Services still using local MongoDB**

**Solutions:**
1. Stop services: `.\stop-all-services.ps1`
2. Verify `config.env.ps1` has Atlas URIs
3. Restart: `.\start-all-services.ps1`
4. Check service logs for connection string

---

## 📚 Additional Documentation

- **Configuration Guide:** See `ENV_CONFIGURATION.md`
- **Service Setup:** See `START_SERVICES_README.md`
- **Quick Start:** See `QUICK_FINISH_GUIDE.md`

---

## 🎯 Quick Commands

```powershell
# Load configuration
. .\config.env.ps1

# View MongoDB URI
echo $env:MONGO_URI_USER

# Test connection
mongosh "$env:MONGO_URI_USER"

# Start all services with MongoDB Atlas
.\start-all-services.ps1

# Check service status
.\check-services-status.ps1

# Stop all services
.\stop-all-services.ps1
```

---

## ✨ Summary

Your microservices platform is now configured to use **MongoDB Atlas** cloud database! 

**What changed:**
- ✅ All MongoDB URIs point to MongoDB Atlas
- ✅ Centralized configuration in `config.env.ps1` / `config.env.sh`
- ✅ Automatic loading when starting services
- ✅ No need for local MongoDB Docker container

**Next steps:**
1. Run `.\start-all-services.ps1` to start with MongoDB Atlas
2. Check service logs to verify connections
3. Test your APIs!

---

**MongoDB Atlas is now your primary database! 🎉**

