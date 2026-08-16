import os
import json
import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import numpy as np
import xgboost as xgb
from explain import RealSHAPExplainer

app = FastAPI(
    title="PayTelemetry Tier 2 ML Microservice",
    description="FastAPI service serving XGBoost fraud classifier and real SHAP explanations",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeatureInput(BaseModel):
    features: List[float] = Field(..., min_length=7, max_length=7, description="7-dimensional feature vector")

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models/xgboost-v1.json')
METRICS_PATH = os.path.join(os.path.dirname(__file__), 'models/metrics.json')

model: Optional[xgb.XGBClassifier] = None
explainer: Optional[RealSHAPExplainer] = None
model_loaded_at: Optional[str] = None

def load_or_train_model():
    global model, explainer, model_loaded_at
    if not os.path.exists(MODEL_PATH):
        print("[Service] Model artifact not found. Triggering train_model()...")
        from train import train_model
        train_model()
        
    m = xgb.XGBClassifier()
    m.load_model(MODEL_PATH)
    model = m
    explainer = RealSHAPExplainer(model)
    model_loaded_at = datetime.datetime.utcnow().isoformat() + "Z"
    print(f"[Service] Loaded XGBoost model from {MODEL_PATH}")

@app.on_event("startup")
async def startup_event():
    load_or_train_model()

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "paytelemetry-tier2-ml",
        "modelVersion": "xgboost-v1",
        "modelLoadedAt": model_loaded_at,
        "isLoaded": model is not None
    }

@app.get("/metrics")
def get_metrics():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"error": "Metrics not found"}

@app.post("/predict")
def predict_fraud(input_data: FeatureInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        X = np.array([input_data.features], dtype=np.float32)
        proba = float(model.predict_proba(X)[0][1])
        
        return {
            "probability": round(proba, 4),
            "modelVersion": "xgboost-v1",
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain")
def explain_features(input_data: FeatureInput):
    if explainer is None:
        raise HTTPException(status_code=503, detail="Explainer not loaded")
        
    try:
        shap_dict = explainer.compute_shap(input_data.features)
        return {
            "shapValues": shap_dict,
            "modelVersion": "xgboost-v1"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
