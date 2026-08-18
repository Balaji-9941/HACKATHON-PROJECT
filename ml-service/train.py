import os
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

FEATURE_NAMES = [
    'amount_ratio',
    'velocity_burst',
    'device_novelty',
    'location_variance',
    'temporal_deviation',
    'merchant_risk',
    'network_risk'
]

CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../fraudshield_dataset_v2_scored.csv'))

def load_data():
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Dataset not found at {CSV_PATH}")
    
    print(f"[Train] Loading dataset from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    print(f"[Train] Loaded dataframe with shape: {df.shape}")

    # Feature 1: amount_ratio (amountToBaselineRatio)
    amount_ratio = df['amountToBaselineRatio'].fillna(1.0).clip(0, 50).values

    # Feature 2: velocity_burst (txnCountLast24h normalized)
    velocity_burst = (df['txnCountLast24h'].fillna(1.0) / 5.0).clip(0, 10).values

    # Feature 3: device_novelty (1.0 if deviceId contains 'DEV-NEW-' or novel device)
    device_novelty = df['deviceId'].astype(str).apply(lambda x: 1.0 if 'DEV-NEW-' in x else 0.0).values

    # Feature 4: location_variance (distanceFromHomeKm normalized, >500km = 1.0)
    location_variance = (df['distanceFromHomeKm'].fillna(0.0) / 1000.0).clip(0, 5).values

    # Feature 5: temporal_deviation (1.0 if transaction in unusual hour 00:00 - 05:00)
    def parse_hour_dev(ts_str):
        try:
            hour = int(str(ts_str).split(' ')[1].split(':')[0])
            return 1.0 if hour < 6 or hour > 23 else 0.0
        except Exception:
            return 0.0
    temporal_deviation = df['timestamp'].apply(parse_hour_dev).values

    # Feature 6: merchant_risk (1.0 for high risk categories: Crypto, Wire Transfer, Quick Loan, Peer Payment to stranger)
    high_risk_cats = {'Wire Transfer', 'Peer Payment', 'Digital Wallet', 'Foreign Exchange', 'Gaming'}
    merchant_risk = df['merchantCategory'].astype(str).apply(lambda x: 1.0 if x in high_risk_cats else 0.2).values

    # Feature 7: network_risk (1.0 if linkedToFraudNetwork is True)
    network_risk = df['linkedToFraudNetwork'].apply(lambda x: 1.0 if str(x).lower() == 'true' else 0.0).values

    # Stack features into X
    X = np.column_stack([
        amount_ratio,
        velocity_burst,
        device_novelty,
        location_variance,
        temporal_deviation,
        merchant_risk,
        network_risk
    ]).astype(np.float32)

    # Target label y: isFraud (0 or 1)
    y = df['isFraud'].fillna(0).astype(np.int32).values

    print(f"[Train] Extracted feature matrix X: {X.shape}, labels y: {np.bincount(y)}")
    return X, y

def train_model():
    X, y = load_data()
    
    # Split train/test (80% train, 20% test stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    # Compute scale_pos_weight for class imbalance
    neg_count = np.sum(y_train == 0)
    pos_count = max(1, np.sum(y_train == 1))
    scale_weight = float(neg_count / pos_count)
    print(f"[Train] Training on {len(X_train)} samples with scale_pos_weight: {scale_weight:.2f}")
    
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.08,
        scale_pos_weight=scale_weight,
        eval_metric='logloss',
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        tree_method='hist'
    )
    
    print(f"[Train] Fitting XGBoost classifier...")
    model.fit(X_train, y_train)
    
    # Evaluate on held-out test split
    print(f"[Train] Evaluating on {len(X_test)} held-out test instances...")
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)
    
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_pred_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    metrics = {
        'modelVersion': 'xgboost-v2-fraudshield',
        'algorithm': 'XGBoost (XGBClassifier - Multi-Feature Gradient Boosting)',
        'trainedOn': f'fraudshield_dataset_v2_scored.csv ({len(X):,} records, {int(np.sum(y)):,} fraud)',
        'trainSamples': int(len(X_train)),
        'testSamples': int(len(X_test)),
        'precision': round(prec, 4),
        'recall': round(rec, 4),
        'f1Score': round(f1, 4),
        'rocAuc': round(roc_auc, 4),
        'confusionMatrix': {
            'tn': cm[0][0] if len(cm) > 0 else 0,
            'fp': cm[0][1] if len(cm) > 0 and len(cm[0]) > 1 else 0,
            'fn': cm[1][0] if len(cm) > 1 else 0,
            'tp': cm[1][1] if len(cm) > 1 and len(cm[1]) > 1 else 0
        },
        'featureImportances': {
            name: round(float(imp), 4)
            for name, imp in zip(FEATURE_NAMES, model.feature_importances_)
        }
    }
    
    # Ensure models directory
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    # Save model artifact
    model_path = os.path.join(models_dir, 'xgboost-v1.json')
    model.save_model(model_path)
    print(f"[Train] Model successfully saved to {model_path}")
    
    # Save real metrics.json
    metrics_path = os.path.join(models_dir, 'metrics.json')
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2)
    print(f"[Train] Ground-truth test metrics saved to {metrics_path}:")
    print(json.dumps(metrics, indent=2))
    
    return metrics

if __name__ == '__main__':
    train_model()
