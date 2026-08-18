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
      sub: 'Real-time telemetry stream',
      icon: Activity,
      iconBg: 'bg-blue-50 border-blue-200 text-blue-600',
      numColor: 'text-slate-900',
      tag: 'Live Feed',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: 'Flagged Incidents',
      val: (m.fraudCaught || 0).toLocaleString(),
      sub: `Intervention rate: ${((m.fraudCaught / Math.max(1, m.totalScored)) * 100).toFixed(1)}%`,
      icon: ShieldAlert,
      iconBg: 'bg-rose-50 border-rose-200 text-rose-600',
      numColor: 'text-rose-700',
      tag: 'Alerts Triaged',
      tagColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    {
      title: 'False Positive Rate',
      val: m.fpRate || '0.8%',
      sub: 'Precision target: <1.5%',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      numColor: 'text-emerald-700',
      tag: 'High Precision',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Telemetry Latency',
      val: `${m.avgLatencyMs || 14.2}ms`,
      sub: 'Tier 1 sub-20ms SLA guaranteed',
      icon: Cpu,
      iconBg: 'bg-purple-50 border-purple-200 text-purple-600',
      numColor: 'text-purple-700',
      tag: 'Sub-20ms SLA',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-card hover:shadow-card-hover transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <p className={`text-2xl font-bold font-mono tracking-tight ${card.numColor}`}>
                {card.val}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-slate-500 font-medium">
                  {card.sub}
                </span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${card.tagColor}`}>
                  {card.tag}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
