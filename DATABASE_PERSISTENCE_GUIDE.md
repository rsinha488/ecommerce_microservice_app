# Database Data Persistence Guide 🗄️

## ✅ Problem Fixed!

Your database data was being deleted every time you ran `start-enhanced.sh` or used certain Docker commands. This has now been fixed!

---

## 🔍 What Was Wrong

### Issue 1: `start-enhanced.sh` Was Destroying Volumes

**Old code (Line 43)**:
```bash
docker-compose down --volumes --remove-orphans
```

The `--volumes` flag **deletes all Docker volumes**, including your MongoDB data!

**Fixed code**:
```bash
docker-compose down --remove-orphans
```

Now it only removes orphaned containers, **keeping your data safe**.

---

### Issue 2: Redis Had No Volume

**Old docker-compose.yml**:
```yaml
redis:
  image: redis:7
  container_name: ecom-redis
  command: ["redis-server", "--appendonly", "yes"]
  # ❌ NO VOLUME - Data lost on container restart
```

**Fixed docker-compose.yml**:
```yaml
redis:
  image: redis:7
  container_name: ecom-redis
  volumes:
    - redis_data:/data  # ✅ Now persists data
  command: ["redis-server", "--appendonly", "yes"]

volumes:
  redis_data:
    driver: local
```

---

### Issue 3: Dangerous Manual Commands

You were using commands that destroy data:

```bash
docker-compose down -v          # ❌ -v flag DELETES ALL VOLUMES
docker-compose rm -f            # ⚠️ Removes containers
docker system prune -f          # ⚠️ Cleans up system (doesn't delete volumes but can confuse)
```

---

## 🎯 What's Fixed Now

### 1. Safe Startup Script

**File**: `start-enhanced.sh`

**Changes Made**:
- ✅ Removed `--volumes` flag from cleanup
- ✅ Added volume existence checks
- ✅ Shows clear warnings about data persistence
- ✅ Faster builds with caching (removed `--no-cache`)

**New Behavior**:
```bash
./start-enhanced.sh

# Output:
# [INFO] Checking existing data volumes...
# [SUCCESS] MongoDB volume exists - your database data will be preserved
# [SUCCESS] Redis volume exists - your session data will be preserved
# [SUCCESS] Docker cleanup completed (MongoDB and Redis data preserved)
```

---

### 2. Redis Data Persistence

**File**: `docker-compose.yml`

**Changes Made**:
- ✅ Added `redis_data` volume
- ✅ Mounted to `/data` directory in Redis container
- ✅ Configured with `appendonly` mode for durability

**Result**: Redis sessions now persist across restarts!

---

### 3. MongoDB Data Persistence

**Already Working** (no changes needed):
- ✅ MongoDB volume: `mongo_data`
- ✅ Mounted to `/data/db`
- ✅ Persists all collections and databases

---

## 📊 Data Volume Status

### Check Your Volumes

```bash
# List all volumes
docker volume ls

# Expected output:
DRIVER    VOLUME NAME
local     ecom_microservice-master_mongo_data
local     ecom_microservice-master_redis_data
```

### Inspect Volume Details

```bash
# MongoDB volume
docker volume inspect ecom_microservice-master_mongo_data

# Redis volume
docker volume inspect ecom_microservice-master_redis_data
```

### Check Volume Size

```bash
# See how much data is stored
docker system df -v | grep -A 5 "VOLUME NAME"
```

---

## 🚀 How to Use Now

### Safe Operations (Data Preserved)

#### 1. **Start the Platform**
```bash
./start-enhanced.sh
```
✅ **Data preserved**: All your MongoDB and Redis data remains intact

#### 2. **Stop the Platform**
```bash
docker-compose down
# OR
./stop-enhanced.sh
```
✅ **Data preserved**: Containers stopped, volumes intact

#### 3. **Restart a Service**
```bash
docker-compose restart mongo
docker-compose restart redis
docker-compose restart auth-service
```
✅ **Data preserved**: Service restarts, data remains

#### 4. **View Logs**
```bash
docker-compose logs -f mongo
docker-compose logs -f auth-service
```
✅ **No impact on data**

#### 5. **Rebuild Services**
```bash
docker-compose build
docker-compose up -d
```
✅ **Data preserved**: Code changes applied, data intact

---

### Dangerous Operations (Data Deleted)

#### ⚠️ **Complete Reset** (Use Only When Needed)
```bash
# Stop and DELETE ALL DATA
docker-compose down -v

# This will:
# ❌ Delete all MongoDB databases
# ❌ Delete all Redis sessions
# ❌ Delete all user accounts, products, orders
# ✅ Useful for: Fresh start, testing, cleaning up
```

#### ⚠️ **Manual Volume Deletion**
```bash
# Delete specific volume
docker volume rm ecom_microservice-master_mongo_data

# Delete all unused volumes
docker volume prune -f
```

---

## 🔄 Common Workflows

### Workflow 1: Daily Development

```bash
# Morning: Start platform
./start-enhanced.sh

# Work on code...
# Make changes to services...

# Evening: Stop platform
docker-compose down

# Next day: Start again
./start-enhanced.sh

# ✅ All your data (users, products, orders) is still there!
```

---

### Workflow 2: Update Service Code

```bash
# 1. Make code changes to a service
vim services/auth/src/main.ts

# 2. Rebuild only that service
docker-compose build auth-service

# 3. Restart the service
docker-compose restart auth-service

# ✅ Code updated, database data preserved
```

---

### Workflow 3: Reset Database (Fresh Start)

```bash
# 1. Stop and remove all data
docker-compose down -v

# 2. Start fresh
./start-enhanced.sh

# ✅ Clean slate, all data deleted
```

---

### Workflow 4: Backup and Restore

#### Backup MongoDB Data

```bash
# Export all databases
docker exec ecom-mongo mongodump --out /data/db/backup

# Copy backup from container to host
docker cp ecom-mongo:/data/db/backup ./mongo-backup-$(date +%Y%m%d)

# Or use Docker volume backup
docker run --rm -v ecom_microservice-master_mongo_data:/data \
  -v $(pwd):/backup alpine tar czf /backup/mongo-backup.tar.gz /data
```

#### Restore MongoDB Data

```bash
# Copy backup to container
docker cp ./mongo-backup ecom-mongo:/data/db/

# Restore databases
docker exec ecom-mongo mongorestore /data/db/backup
```

#### Backup Redis Data

```bash
# Force save
docker exec ecom-redis redis-cli SAVE

# Copy RDB file from volume
docker run --rm -v ecom_microservice-master_redis_data:/data \
  -v $(pwd):/backup alpine cp /data/dump.rdb /backup/redis-backup.rdb
```

---

## 📝 Updated Commands Reference

### ✅ Safe Commands (Data Preserved)

| Command | What It Does | Data Safe? |
|---------|-------------|------------|
| `./start-enhanced.sh` | Start all services | ✅ Yes |
| `docker-compose down` | Stop all services | ✅ Yes |
| `docker-compose restart [service]` | Restart a service | ✅ Yes |
| `docker-compose build` | Rebuild images | ✅ Yes |
| `docker-compose ps` | Show running containers | ✅ Yes |
| `docker-compose logs -f [service]` | View logs | ✅ Yes |
| `docker system prune -f` | Clean unused resources | ✅ Yes (doesn't touch volumes) |

### ⚠️ Dangerous Commands (Data Deleted)

| Command | What It Does | Data Safe? |
|---------|-------------|------------|
| `docker-compose down -v` | Stop and delete volumes | ❌ No - DELETES ALL DATA |
| `docker-compose down --volumes` | Same as above | ❌ No - DELETES ALL DATA |
| `docker volume rm [volume]` | Delete specific volume | ❌ No - DELETES THAT VOLUME |
| `docker volume prune` | Delete all unused volumes | ❌ No - DELETES UNUSED VOLUMES |
| `docker system prune -af --volumes` | Nuclear option | ❌ No - DELETES EVERYTHING |

---

## 🧪 Testing Data Persistence

### Test 1: Restart Persistence

```bash
# 1. Start platform
./start-enhanced.sh

# 2. Create a test user via frontend
# Visit http://localhost:3000/login
# Register: test@example.com

# 3. Stop platform
docker-compose down

# 4. Start again
./start-enhanced.sh

# 5. Login with test@example.com
# ✅ Should work - user data persisted!
```

---

### Test 2: Service Restart Persistence

```bash
# 1. Create some data (register user, add products)

# 2. Restart MongoDB
docker-compose restart mongo

# 3. Check if data is still there
# ✅ Should be intact!

# 4. Restart auth service
docker-compose restart auth-service

# 5. Try logging in
# ✅ Should work!
```

---

### Test 3: Rebuild Persistence

```bash
# 1. Have some data in the system

# 2. Make a code change
vim services/auth/src/main.ts

# 3. Rebuild
docker-compose build auth-service
docker-compose up -d auth-service

# 4. Check data
# ✅ All data preserved!
```

---

## 🛠️ Troubleshooting

### Issue: "My data is still disappearing!"

**Check these**:

1. **Are you using `-v` flag?**
   ```bash
   # Bad (deletes data)
   docker-compose down -v

   # Good (keeps data)
   docker-compose down
   ```

2. **Check if volumes exist**:
   ```bash
   docker volume ls | grep mongo
   docker volume ls | grep redis
   ```

3. **Check volume mounts**:
   ```bash
   docker inspect ecom-mongo | grep -A 10 Mounts
   docker inspect ecom-redis | grep -A 10 Mounts
   ```

---

### Issue: "Volume permission errors"

```bash
# Fix permissions
docker exec ecom-mongo chown -R mongodb:mongodb /data/db
docker exec ecom-redis chown -R redis:redis /data
```

---

### Issue: "Out of disk space"

```bash
# Check volume sizes
docker system df -v

# Clean up unused containers/images (keeps volumes)
docker system prune -f

# If needed, delete old volumes manually
docker volume ls
docker volume rm <old-volume-name>
```

---

### Issue: "Corrupted database"

```bash
# MongoDB repair
docker exec ecom-mongo mongod --repair

# Redis rebuild
docker exec ecom-redis redis-cli BGREWRITEAOF
```

---

## 📋 Best Practices

### ✅ DO:
- Use `docker-compose down` (without `-v`) to stop services
- Run `./start-enhanced.sh` to start services
- Create regular backups of important data
- Check volume existence: `docker volume ls`
- Use `docker-compose restart` for service restarts

### ❌ DON'T:
- Don't use `docker-compose down -v` unless you want to delete data
- Don't use `docker volume prune` without checking first
- Don't delete volumes manually unless necessary
- Don't use `--volumes` flag in stop commands
- Don't use `docker system prune --volumes` (keeps them by default now)

---

## 🎯 Quick Reference Card

### Daily Operations
```bash
# Start (safe)
./start-enhanced.sh

# Stop (safe)
docker-compose down

# Restart service (safe)
docker-compose restart [service-name]

# View logs (safe)
docker-compose logs -f [service-name]

# Check status (safe)
docker-compose ps
docker volume ls
```

### When You Need Fresh Start
```bash
# ⚠️ WARNING: This deletes ALL data
docker-compose down -v
./start-enhanced.sh
```

---

## 🎉 Summary

### What Changed:
1. ✅ **start-enhanced.sh** - Removed `--volumes` flag, added volume checks
2. ✅ **docker-compose.yml** - Added `redis_data` volume for Redis persistence
3. ✅ **Faster builds** - Removed `--no-cache` flag for quicker rebuilds

### What You Get:
- 🔒 **Data persists** across service restarts
- 🔒 **Data persists** when you stop/start platform
- 🔒 **Data persists** when you rebuild services
- 🚀 **Faster startup** (cached builds)
- 📊 **Clear warnings** about data operations
- 🎯 **Control** over when to delete data (explicit `-v` flag)

### Your Workflow Now:
```bash
# Daily use (data safe)
./start-enhanced.sh  # Start
# ... do your work ...
docker-compose down  # Stop

# Need fresh start (data deleted)
docker-compose down -v  # Explicit delete
./start-enhanced.sh     # Fresh start
```

**Your database data now persists automatically! 🎉**
