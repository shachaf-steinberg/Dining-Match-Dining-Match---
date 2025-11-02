# Terminal Guide - How to Use Terminal Commands

## Basic Terminal Usage

### Opening Terminal
- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
- **Windows**: Press `Win + R`, type "cmd", press Enter
- **Linux**: Press `Ctrl + Alt + T`

---

## Basic Terminal Commands

### 1. **Navigation**
```bash
# See current directory
pwd

# List files in current directory
ls

# Change directory
cd backend

# Go back one directory
cd ..

# Go to home directory
cd ~

# Go to specific path
cd /Users/shachaf/Desktop/Dining-Match-Dining-Match---/backend
```

### 2. **Running Your Server**

#### **Step 1: Navigate to backend folder**
```bash
cd /Users/shachaf/Desktop/Dining-Match-Dining-Match---/backend
```

#### **Step 2: Start the server**
```bash
# Option 1: Using npm script
npm start

# Option 2: Direct node command
node server.js
```

**You should see:**
```
================================================
🍽️  Dining Match Backend Server
================================================
✅ Server is running on http://localhost:3001
📡 Environment: development
🔗 Health Check: http://localhost:3001/api/health
...
```

**To stop the server:** Press `Ctrl + C`

---

## Testing API Endpoints

### Option 1: Using `curl` (Built into Mac/Linux)

#### **Test Health Endpoint**
```bash
curl http://localhost:3001/api/health
```

#### **Get All Restaurants**
```bash
curl http://localhost:3001/api/restaurants
```

#### **Get Restaurant by ID**
```bash
curl http://localhost:3001/api/restaurants/1
```

#### **Create New Restaurant**
```bash
curl -X POST http://localhost:3001/api/restaurants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Place",
    "cuisine": "Italian",
    "address": "123 Main St",
    "rating": 4.5,
    "price_range": "$$",
    "hours_of_operation": "Mon-Sun: 11:00-23:00"
  }'
```

#### **Update Restaurant**
```bash
curl -X PUT http://localhost:3001/api/restaurants/1 \
  -H "Content-Type: application/json" \
  -d '{"rating": 4.9}'
```

#### **Delete Restaurant**
```bash
curl -X DELETE http://localhost:3001/api/restaurants/1
```

---

### Option 2: Using Browser

Just open these URLs in your browser:

- Health Check: `http://localhost:3001/api/health`
- All Restaurants: `http://localhost:3001/api/restaurants`
- Restaurant by ID: `http://localhost:3001/api/restaurants/1`

**Note**: Browser only works for GET requests. For POST/PUT/DELETE, use `curl` or a tool like Postman.

---

### Option 3: Using Postman (Recommended for Testing)

1. **Download Postman**: https://www.postman.com/downloads/
2. **Create a new request**
3. **Set method** (GET, POST, PUT, DELETE)
4. **Enter URL**: `http://localhost:3001/api/restaurants`
5. **Add body** (for POST/PUT): Select "Body" → "raw" → "JSON"
6. **Click Send**

---

## Common Terminal Tips

### **Multi-line Commands**
If a command is too long, use `\` to continue on next line:
```bash
curl -X POST http://localhost:3001/api/restaurants \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```

### **View Output in Pretty Format**
Install `jq` for JSON formatting:
```bash
# Install jq (if needed)
brew install jq  # Mac
# or
sudo apt-get install jq  # Linux

# Use it
curl http://localhost:3001/api/restaurants | jq
```

### **Clear Terminal**
```bash
clear
# or
Ctrl + L
```

### **Auto-complete**
Press `Tab` to auto-complete file/folder names

### **Command History**
- Press `↑` (up arrow) to see previous commands
- Press `↓` (down arrow) to go forward
- Type `history` to see all commands

---

## Quick Start Checklist

1. ✅ **Open Terminal**
2. ✅ **Navigate to backend folder:**
   ```bash
   cd /Users/shachaf/Desktop/Dining-Match-Dining-Match---/backend
   ```
3. ✅ **Start the server:**
   ```bash
   npm start
   ```
4. ✅ **Open a NEW terminal window** (keep server running in first one)
5. ✅ **Test the API:**
   ```bash
   curl http://localhost:3001/api/health
   ```

---

## Troubleshooting

### **"command not found" error**
- Make sure you're in the right directory
- Check if Node.js is installed: `node --version`

### **"Port already in use" error**
- Another process is using port 3001
- Change PORT in server.js or kill the process:
  ```bash
  # Find process using port 3001
  lsof -ti:3001
  
  # Kill it
  kill -9 $(lsof -ti:3001)
  ```

### **"Cannot find module" error**
- Install dependencies:
  ```bash
  npm install
  ```

### **Server won't start**
- Make sure you're in the `backend` directory
- Check that `server.js` exists
- Look at the error message for clues

---

## Example Session

Here's what a typical session looks like:

```bash
# 1. Navigate to backend
cd /Users/shachaf/Desktop/Dining-Match-Dining-Match---/backend

# 2. Start server
npm start

# Server output:
# ================================================
# 🍽️  Dining Match Backend Server
# ================================================
# ✅ Server is running on http://localhost:3001
# ...

# 3. In a NEW terminal, test endpoints
curl http://localhost:3001/api/health
# Output: {"status":"healthy","timestamp":"..."}

curl http://localhost:3001/api/restaurants
# Output: {"success":true,"count":2,"data":[...]}

# 4. Stop server: Go back to first terminal and press Ctrl+C
```

---

## Need More Help?

- **Node.js docs**: https://nodejs.org/docs
- **Express.js docs**: https://expressjs.com/
- **curl docs**: `man curl` in terminal

