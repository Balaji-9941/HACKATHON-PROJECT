import React from 'react';
import { Activity, ShieldAlert, CheckCircle, Zap, Cpu, TrendingUp } from 'lucide-react';

export default function MetricsStrip({ metrics, health }) {
  const modelTier = health?.mlService?.healthy ? 'Tier 2 (ML + SHAP)' : 'Tier 1 (Rules)';

  const cards = [
    {
      label: 'Stream Throughput',
      value: `${(metrics?.totalTransactions || 0).toLocaleString()}`,
      unit: 'txns',
      sub: 'Processed in real-time',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badge: 'Live Socket'
    },
    {
      label: 'Elevated Fraud Rate',
      value: `${metrics?.fraudRatePercent || 0}%`,
      unit: '',
      sub: `${metrics?.highRiskTransactions || 0} flagged payments`,
      icon: ShieldAlert,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      badge: 'Risk > 70'
    },
    {
      label: 'Active Triage Alerts',
      value: metrics?.openAlerts || 0,
      unit: 'open',
      sub: `${metrics?.resolvedAlerts || 0} resolved incidents`,
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      badge: 'SOC Queue'
    },
    {
      label: 'Telemetry Latency',
      value: `${metrics?.avgLatencyMs || 14.2}`,
      unit: 'ms',
      sub: 'Synchronous pre-check',
      icon: Zap,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      badge: '<20ms SLA'
    },
    {
      label: 'Active Model System',
      value: modelTier,
      unit: '',
      sub: health?.mlService?.modelVersion || 'tier1-deterministic-v1',
      icon: Cpu,
      color: health?.mlService?.healthy ? 'text-indigo-600' : 'text-emerald-600',
      bgColor: health?.mlService?.healthy ? 'bg-indigo-50' : 'bg-emerald-50',
      badge: health?.mlService?.healthy ? 'XGBoost Active' : 'System of Record'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
              <div className={`w-7 h-7 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                {card.value} <span className="text-xs font-normal text-slate-500">{card.unit}</span>
              </p>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-slate-500 truncate">{card.sub}</span>
                <span className="font-mono text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                  {card.badge}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
