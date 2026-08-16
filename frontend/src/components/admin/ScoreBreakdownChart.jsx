import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function ScoreBreakdownChart({ transaction }) {
  if (!transaction) return null;

  const isTier2 = transaction.modelTier === 2 && transaction.shapValues;
  const rawShap = transaction.shapValues;

  let chartData = [];

  if (isTier2 && rawShap) {
    // Real SHAP Values from Python TreeExplainer
    chartData = Object.entries(rawShap).map(([key, val]) => {
      const formattedName = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      return {
        factor: formattedName,
        value: Number(val) || 0,
        type: 'shap'
      };
    }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  } else {
    // Tier 1 Rule Breakdown Waterfall
    const rb = transaction.riskBreakdown || {};
    chartData = [
      { factor: 'Amount Anomaly', value: rb.amountAnomaly || 0 },
      { factor: 'Velocity Burst', value: rb.velocityBurst || 0 },
      { factor: 'Device Novelty', value: rb.deviceNovelty || 0 },
      { factor: 'Location Variance', value: rb.locationVariance || 0 },
      { factor: 'Temporal Dev.', value: rb.temporalDeviation || 0 },
      { factor: 'Merchant Risk', value: rb.merchantRisk || 0 },
      { factor: 'Network Consistency', value: rb.networkConsistency || 0 }
    ].filter(d => d.value > 0);
  }

  const maxValue = Math.max(...chartData.map(d => Math.abs(d.value)), 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Explainable Factor Waterfall</h4>
        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
          isTier2 
            ? 'bg-blue-50 text-blue-700 border-blue-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {isTier2 ? '● SHAP (Tier 2 ML TreeExplainer)' : '● Tier 1 Deterministic Factors'}
        </span>
      </div>

      {chartData.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">No anomalous feature deviations detected.</p>
      ) : (
        <div className="space-y-2">
          {chartData.map((item, idx) => {
            const widthPct = Math.min(100, Math.round((Math.abs(item.value) / maxValue) * 100));
            const isPositive = item.value >= 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-medium">{item.factor}</span>
                  <span className={`font-mono text-[11px] ${isPositive ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}`}>
                    {isPositive ? `+${item.value}` : item.value} {isTier2 ? 'SHAP' : 'pts'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTier2
                        ? (isPositive ? 'bg-blue-600' : 'bg-emerald-600')
                        : (item.value >= 15 ? 'bg-rose-600' : item.value >= 8 ? 'bg-amber-500' : 'bg-emerald-600')
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
