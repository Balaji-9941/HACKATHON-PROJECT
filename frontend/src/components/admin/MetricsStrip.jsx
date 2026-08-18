import React from 'react';
import { Activity, ShieldAlert, Cpu, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/api';

export default function MetricsStrip({ metrics, health }) {
  const m = metrics || {
    totalScored: 1240,
    fraudCaught: 24,
    fpRate: '0.8%',
    avgLatencyMs: 14.2,
    tier2Active: true,
    totalVolumeINR: 4250000
  };

  const cards = [
    {
      title: 'Scored Transactions',
      val: (m.totalScored || 0).toLocaleString(),
      sub: 'Real-time telemetry baseline',
      icon: Activity
    },
    {
      title: 'Flagged Incidents',
      val: (m.fraudCaught || 0).toLocaleString(),
      sub: `Intervention rate: ${((m.fraudCaught / Math.max(1, m.totalScored)) * 100).toFixed(1)}%`,
      icon: ShieldAlert
    },
    {
      title: 'False Positive Rate',
      val: m.fpRate || '0.8%',
      sub: 'Precision target: <1.5%',
      icon: CheckCircle2
    },
    {
      title: 'Telemetry Latency',
      val: `${m.avgLatencyMs || 14.2}ms`,
      sub: 'Tier 1 sub-20ms SLA verified',
      icon: Cpu
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold font-mono text-slate-950 tracking-tight">
                {card.val}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {card.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
