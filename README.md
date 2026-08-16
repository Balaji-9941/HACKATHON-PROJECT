# PayTelemetry — Real-Time Payments Fraud Detection Platform
### Reliability-Hardened Edition (MERN + Layered ML Microservice)

PayTelemetry is a production-grade, full-stack payments fraud detection platform and Security Operations Center (SOC) command center built on the MERN stack (MongoDB, Express, React 18, Node 20) with Socket.io real-time streaming, plus an asynchronous Tier 2 Python ML microservice (FastAPI + XGBoost + real SHAP explainability).

---

## 1. System Architecture

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    Client Layer                        │
                               ├──────────────────────────┬─────────────────────────────┤
                               │ Consumer App (GPay-style)│ Investigator Command Center │
                               └────────────┬─────────────┴──────────────┬──────────────┘
                                            │                            │
                                            │ REST / Socket.io           │ REST / Socket.io
                                            ▼                            ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                               Node.js / Express Backend                               │
│                                                                                       │
│  ┌─────────────────────────┐   ┌──────────────────────────┐   ┌────────────────────┐  │
│  │ Tier 1 Telemetry Engine │   │   Circuit Breaker ML     │   │ AutoFlow Engine &  │  │
│  │ 7 Deterministic Rules   ├──►│   Client (150ms timeout) │   │ Replay Streamer    │  │
│  │ + Mahalanobis (<20ms)   │   └────────────┬─────────────┘   └────────────────────┘  │
│  └────────────┬────────────┘                │ (Async Non-Blocking)                    │
│               │                             ▼                                         │
│               │             ┌─────────────────────────────┐                           │
│               │             │ Python FastAPI ML Service   │                           │
│               │             │ XGBoost + SHAP TreeExplainer│                           │
│               │             └─────────────────────────────┘                           │
│               ▼                                                                       │
│  ┌─────────────────────────┐   ┌──────────────────────────┐   ┌────────────────────┐  │
│  │ Explanation Waterfall   │   │  Network Graph Engine    │   │ Adaptive Threshold │  │
│  │ & Narrative Layer       │   │  (Mule Ring Clustering)  │   │ Auto-Tuning        │  │
│  └─────────────────────────┘   └──────────────────────────┘   └────────────────────┘  │
└───────────────────────────────────────────┬───────────────────────────────────────────┘
                                            │
                                            ▼
                             ┌──────────────────────────────┐
                             │       MongoDB 7.x Data       │
                             │ (Transactions, Alerts, Logs) │
                             └──────────────────────────────┘
```

### Key Architectural Pillars:
1. **Layered Reliability**: Tier 1 (7 deterministic signals + Mahalanobis multivariate distance) is synchronous, executes in **<20ms**, and is 100% resilient. Tier 2 (Python XGBoost + real SHAP) is non-blocking with an automatic 150ms circuit breaker.
2. **Graduated Friction (Never Blocks)**: Every transaction settles! Detection introduces progressive friction (None $\to$ Banner $\to$ Confirmation Modal $\to$ Step-Up PIN $\to$ Step-Up + Investigator Alert).
3. **No Synthetic / Faked Core Scoring**: Zero `Math.random()` in risk scores, SHAP values, or adaptive calculations. Features are derived from genuine dataset distributions.

---

## 2. Dataset Licensing & Provenance

PayTelemetry derives customer baselines and feature distributions from genuine payment fraud benchmarks. All licenses have been verified:

| Dataset | Provenance | Exact License & Terms | Source Link |
|---|---|---|---|
| **IEEE-CIS Fraud Detection** | Vesta / IEEE-CIS Competition | **Kaggle Competition Official Rules**<br>*(Non-Commercial Research & Competition Evaluation use only; external commercial redistribution prohibited)* | [IEEE-CIS Rules](https://www.kaggle.com/c/ieee-fraud-detection/rules) |
| **ULB Credit Card Fraud** | Machine Learning Group, ULB | **Open Database License (ODbL) v1.0** / Database Contents License (DbCL)<br>*(Open for public/commercial use with attribution)* | [ULB CreditCard Dataset](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) |
| **PaySim1 Mobile Money** | NTNU / synthetic simulator | **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**<br>*(Permits sharing and adaptation with attribution)* | [PaySim1 Dataset](https://www.kaggle.com/datasets/ealaxi/paysim1) |

---

## 3. Quick Start & Setup

### Prerequisites
- **Node.js**: v20.x or v22.x
- **Python**: 3.11 or 3.12
- **MongoDB**: 7.x (running on `127.0.0.1:27017`)

### 1. Clone & Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# Python ML Microservice dependencies
cd ../ml-service
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
```

### 2. Seed Database & Train Tier 2 Model
```bash
# Seed initial demo merchants, investigators, and transactions
cd ../backend
node seed.js

# Train Tier 2 XGBoost model and generate real SHAP explainer
cd ../ml-service
.\venv\Scripts\python train.py
```

### 3. Run the Services
**Terminal 1 (Python Tier 2 ML Microservice):**
```bash
cd ml-service
.\venv\Scripts\python -m uvicorn predict:app --host 127.0.0.1 --port 8000
```

**Terminal 2 (Express Backend & Socket.io Streamer):**
```bash
cd backend
npm start
```

**Terminal 3 (Vite + React Frontend):**
```bash
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** to access the application.

---

## 4. Demo Credentials & Test Users

### Security Operations Center (SOC) Investigators:
| Username | Password | Role | Description |
|---|---|---|---|
| `analyst1` | `password123` | Analyst | Triage alerts, review cases, inspect waterfalls |
| `senior1` | `password123` | Senior Lead | Case resolution, network analysis, threshold calibration |
| `admin1` | `password123` | SOC Admin | Full admin access, auto-flow configuration |

### Demo Consumer Profiles:
- **Aarav Patel** (`CUST-1001` / `aarav.patel@okaxis`): Primary demo account with ₹75,450 balance and established baseline (₹650 mean, Bangalore).
- **Rohan Verma** (`CUST-1002` / `rohan.v@okhdfcbank`): Frequent contact.
- **Sneha Kapoor** (`CUST-1003` / `sneha.k@okicici`): High-volume consumer account (₹112,000 balance).
- **Mule Node Alpha** (`CUST-9901` / `mule.alpha@cryptonet`): High-risk mule cluster node.

---

## 5. Live Scenario Injector (Judge Control Panel)

From the **Scenario Injector & Stream** tab in the Investigator Command Center (or via API `POST /api/simulator/trigger`), fire 5 realistic fraud patterns on demand:

1. **Velocity Burst Attack**: 4 rapid-fire transfers in <30 seconds triggering velocity burst rules.
2. **Device Takeover**: High-volume transfer (9.5× mean) from an unrecognized hardware emulator.
3. **Impossible Travel Jump**: Cross-continental transfer originating in Moscow, RU at 03:15 AM off-hours.
4. **Mule Ring Funnel**: Funneling transfer into CryptoExchange P2P Desk through flagged mule nodes.
5. **Card Testing Bot**: Scripted micro-amount probing.

---

## 6. Circuit Breaker & Reliability Verification

To verify that Tier 1 operates independently of Tier 2:
1. Start Auto-Flow streaming on the Admin Dashboard.
2. Stop the Python ML service process (`kill` port 8000).
3. Confirm in `SystemHealthPanel` that the ML service indicator turns amber (`Circuit: OPEN`) within 10s.
4. Confirm consumer payments and background auto-flow continue pumping transactions uninterrupted with `modelTier: 1`.

---

## 7. Environment Variables

### `backend/.env`
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Express HTTP & Socket.io port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/paytelemetry` | Database connection string |
| `JWT_SECRET` | `paytelemetry_jwt_secret_dev_key_2026` | Token encryption secret |
| `ML_SERVICE_URL`| `http://127.0.0.1:8000` | Python FastAPI endpoint |
| `ML_SERVICE_ENABLED` | `true` | Enables/disables Tier 2 calls |
| `AUTO_FLOW_ENABLED` | `true` | Starts background transaction loop on boot |
| `AI_API_KEY` | *(Optional)* | Gemini API key for narrative synthesis |

### `ml-service/.env`
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8000` | FastAPI server port |
| `HOST` | `127.0.0.1` | Binding address |

---

## 8. Automated Verification & Testing

Run all unit, integration, and performance assertions:
```bash
cd backend
npm test
```
- Tier 1 calculation accuracy & latency SLA: **<20ms**
- Settlement confirm response latency: **<200ms**
- AutoFlow resilience under mid-stream failure: **Passed**
- Real SHAP TreeExplainer & Circuit Breaker: **Passed**
