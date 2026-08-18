import React from 'react';
import { Layers } from 'lucide-react';

export default function ScoreBreakdownChart({ transaction }) {
  if (!transaction) return null;

  // Use real SHAP values from Tier 2 if available, or calculate from riskBreakdown
  const shap = transaction.shapValues || {};
  const breakdown = transaction.riskBreakdown || {};

  const items = [
    { label: 'Amount vs Baseline', val: shap.amount_ratio ?? (breakdown.amountAnomaly ? breakdown.amountAnomaly / 20 : 0.05) },
    { label: 'Velocity Frequency', val: shap.velocity_burst ?? (breakdown.velocityBurst ? breakdown.velocityBurst / 20 : 0.02) },
    { label: 'Hardware Anomaly', val: shap.device_novelty ?? (breakdown.deviceNovelty ? breakdown.deviceNovelty / 15 : 0.01) },
    { label: 'Location Displacement', val: shap.location_variance ?? (breakdown.locationVariance ? breakdown.locationVariance / 15 : 0.01) },
    { label: 'Time-of-Day Drift', val: shap.temporal_deviation ?? (breakdown.temporalDeviation ? breakdown.temporalDeviation / 10 : 0.01) },
    { label: 'Counterparty Category Risk', val: shap.merchant_risk ?? (breakdown.merchantRisk ? breakdown.merchantRisk / 10 : 0.01) },
  ];

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Feature Attribution (TreeSHAP Marginal Contribution)</span>
        </span>
        <span className="font-mono text-slate-500 text-[11px]">Base: 0.02</span>
      </div>

      <div className="space-y-2 text-xs">
        {items.map((item, idx) => {
          const numVal = typeof item.val === 'number' ? item.val : Number(item.val) || 0;
          const isElevated = numVal > 0.15;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-700 font-medium">{item.label}</span>
                <span className={`font-mono font-bold ${isElevated ? 'text-rose-700' : 'text-blue-700'}`}>
                  {numVal > 0 ? `+${(numVal * 100).toFixed(1)}%` : `${(numVal * 100).toFixed(1)}%`}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isElevated ? 'bg-rose-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(100, Math.max(4, Math.abs(numVal) * 100))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
