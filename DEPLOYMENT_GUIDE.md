# 🚀 PayTelemetry / FraudShield AI — Complete Deployment Guide

This guide provides 3 proven deployment methods to deploy the entire PayTelemetry platform to production or cloud hosting.

---

## 📌 Deployment Architecture Overview

```
[ Internet / Users ]
         │
         ▼
[ React Frontend ] ──(Port 80 / Vercel / Netlify)
         │
         ├───▶ [ Node.js Express Gateway (Port 5000 / Render / Railway) ]
         │                │
         │                ├───▶ [ Python FastAPI ML Service (Port 8000) ]
         │                │
         │                └───▶ [ MongoDB Document Store (Port 27017 / Atlas) ]
```

---

## 🐳 OPTION 1: 1-Command Docker Deployment (Recommended for VPS / AWS / Cloud VMs)

Every service now includes a production-ready `Dockerfile` and root `docker-compose.yml`.

### Step 1: Install Docker & Docker Compose on your Server
Ensure Docker is installed:
```bash
docker --version
docker compose version
```

### Step 2: Launch All 4 Services with 1 Command
From the project root:
```bash
docker compose up --build -d
```

### Step 3: Seed Database Inside Container
```bash
docker exec -it paytelemetry-backend node seed.js
```

### 🌐 Access Points:
- **Web App (Frontend)**: `http://<your-server-ip>`
- **Backend API**: `http://<your-server-ip>:5000/api/health`
- **Python ML API**: `http://<your-server-ip>:8000/docs`

---

## ☁️ OPTION 2: Free-Tier Cloud Deployment (Vercel + Render + MongoDB Atlas)

You can deploy the entire stack for **$0 / month** using free-tier cloud providers.

### 1️⃣ Database: MongoDB Atlas (Free M0 Cluster)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. Under "Database Access", create a user (e.g. `admin` / `Password123!`).
3. Under "Network Access", allow IP access from anywhere (`0.0.0.0/0`).
4. Copy your Connection String URI:
   `mongodb+srv://admin:Password123!@cluster0.abcde.mongodb.net/paytelemetry?retryWrites=true&w=majority`

---

### 2️⃣ Python ML Service: Deploy on Render / Railway
1. Go to [render.com](https://render.com) and create a **Web Service** connected to your GitHub repo.
2. Configure settings:
   - **Root Directory**: `ml-service`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn predict:app --host 0.0.0.0 --port $PORT`
3. Copy the deployed URL (e.g., `https://paytelemetry-ml.onrender.com`).

---

### 3️⃣ Node.js Backend Gateway: Deploy on Render / Railway
1. Create another **Web Service** on Render connected to the same repo.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `MONGO_URI`: *(Your MongoDB Atlas URI from Step 1)*
   - `ML_SERVICE_URL`: *(Your Python ML URL from Step 2, e.g. `https://paytelemetry-ml.onrender.com`)*
   - `NODE_ENV`: `production`
4. Run the seed script once via Render Shell or local connection:
   `MONGO_URI="<your-atlas-uri>" node backend/seed.js`
5. Copy the deployed backend URL (e.g., `https://paytelemetry-backend.onrender.com`).

---

### 4️⃣ React Frontend: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) $\to$ **Add New Project** $\to$ Select `Balaji-9941/HACKATHON-PROJECT`.
2. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://paytelemetry-backend.onrender.com`
4. Click **Deploy**!
   Your live application will be available at: `https://paytelemetry.vercel.app`

---

## 🖥️ OPTION 3: Single Linux VM (Ubuntu / Debian / AWS EC2) with PM2 & Nginx

### 1. Install Node, Python, and PM2
```bash
sudo apt update && sudo apt install -y nodejs npm python3-pip python3-venv nginx
sudo npm install -g pm2
```

### 2. Start Python ML Microservice
```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pm2 start "python3 -m uvicorn predict:app --host 127.0.0.1 --port 8000" --name "ml-service"
```

### 3. Seed & Start Node.js Backend
```bash
cd ../backend
npm install
node seed.js
pm2 start server.js --name "backend"
```

### 4. Build Frontend & Configure Nginx
```bash
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/
```

### 5. Save PM2 Process List
```bash
pm2 save
pm2 startup
```

---

## ✅ Deployment Verification Checklist

- [ ] `GET /api/health` returns `status: "ok"` and `mongodb.connected: true`.
- [ ] `POST /api/transactions/pre-check` executes in under 25ms.
- [ ] User can switch accounts on the frontend and see real-time balance updates.
- [ ] Investigator Command Center receives live transactions via WebSocket.
