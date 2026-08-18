import numpy as np
import shap

FEATURE_NAMES = [
    'amount_ratio',
    'velocity_burst',
    'device_novelty',
    'location_variance',
    'temporal_deviation',
    'merchant_risk',
    'network_risk',
    'account_drain',
    'rule_score',
    'txn_type_risk'
]

class RealSHAPExplainer:
    def __init__(self, model):
        self.model = model
        self.explainer = shap.TreeExplainer(model)

    def compute_shap(self, feature_vector):
        """
        Computes exact TreeSHAP values for an input vector
        """
        X = np.array([feature_vector], dtype=np.float32)
        shap_values = self.explainer.shap_values(X)
        
        if isinstance(shap_values, list):
            vals = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        else:
            vals = shap_values[0]

        result = {}
        for name, val in zip(FEATURE_NAMES, vals):
            result[name] = round(float(val), 4)
            
        return result
