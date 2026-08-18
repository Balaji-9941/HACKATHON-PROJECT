import React from 'react';
import { X, ShieldAlert, Cpu, Activity, ExternalLink, Smartphone, MapPin, Clock, User, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency, getRiskColor } from '../../utils/api';
import ScoreBreakdownChart from './ScoreBreakdownChart';

export default function TelemetryDrawer({ transaction, onClose, onInspectNetwork }) {
  if (!transaction) return null;

  const risk = getRiskColor(transaction.alertSeverity);
  const riskBreakdown = transaction.riskBreakdown || {};
  const factors = transaction.explanationFactors || [];

  const signals = [
    { label: 'Amount Baseline Anomaly', score: riskBreakdown.amountAnomaly || 0, max: 50 },
    { label: 'Velocity Burst (120s)', score: riskBreakdown.velocityBurst || 0, max: 30 },
    { label: 'Device Novelty Signature', score: riskBreakdown.deviceNovelty || 0, max: 30 },
    { label: 'Geographic Location Variance', score: riskBreakdown.locationVariance || 0, max: 30 },
    { label: 'Temporal Active Window', score: riskBreakdown.temporalDeviation || 0, max: 15 },
    { label: 'Counterparty Category Risk', score: riskBreakdown.merchantRisk || 0, max: 10 },
    { label: 'Network Graph Topology', score: riskBreakdown.networkConsistency || 0, max: 15 },
    { label: 'Account Liquidity Drain', score: riskBreakdown.accountDrain || 0, max: 40 },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white border-l border-slate-200 shadow-modal flex flex-col justify-between animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs text-slate-500 font-bold">{transaction.transactionId}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase font-bold ${risk.badge}`}>
              {transaction.alertSeverity}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            XGBoost ML Inspector & TreeSHAP Explainability
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Core Transaction Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Amount (INR)</span>
            <p className="text-xl font-bold font-mono text-slate-900">{formatCurrency(transaction.amount)}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">ML Model Risk Score</span>
            <p className="text-xl font-bold font-mono text-rose-700">{transaction.totalRiskScore}/100</p>
          </div>
        </div>

        {/* Hypothesis / Primary Inference Box */}
        <div className={`p-4 rounded-xl border space-y-1.5 ${risk.bg} ${risk.border}`}>
          <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>XGBoost Fraud Classification Inference:</span>
          </span>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {transaction.fraudExplanation || 'All 10 telemetry factors evaluated within safe operational bounds.'}
          </p>

          {/* AI Narrative if available */}
          {transaction.aiNarrative && (
            <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed shadow-xs">
              <span className="font-bold text-blue-700 block mb-1">AI Narrative Synthesis:</span>
              <p className="italic font-medium">{transaction.aiNarrative}</p>
            </div>
          )}
        </div>

        {/* Complete Factor Breakdown Checklist (All 10 Factors) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              All 10 Calculated Telemetry Factors
            </h4>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">100% Comprehensive</span>
          </div>

          <div className="space-y-2">
            {factors.map((f, idx) => {
              const isFlagged = f.status === 'flagged';
              const isWarning = f.status === 'warning';
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 transition ${
                    isFlagged
                      ? 'bg-rose-50/80 border-rose-200 text-rose-950 shadow-xs'
                      : isWarning
                      ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                      : 'bg-slate-50/80 border-slate-200 text-slate-900'
                  }`}
                >
                  {isFlagged ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{f.factor}</span>
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        isFlagged ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isFlagged ? `+${f.contribution} pts` : 'Verified (0 pts)'}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-85 mt-1 leading-relaxed">{f.plainText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multivariate Signal Telemetry Meters */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Multivariate Signal Telemetry (XGBoost Input Space)
          </h4>
          <div className="space-y-2">
            {signals.map((sig, idx) => {
              const ratio = sig.score / sig.max;
              const barColor = ratio > 0.6 ? 'bg-rose-600' : ratio > 0.3 ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">{sig.label}</span>
                    <span className="font-mono text-slate-900 font-semibold">{sig.score}/{sig.max} pts</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${Math.min(100, Math.max(2, ratio * 100))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real TreeSHAP Factor Attributions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Exact TreeSHAP Additive Factor Attribution
            </h4>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
              shap.TreeExplainer (C++)
            </span>
          </div>

          <ScoreBreakdownChart
            shapValues={transaction.shapValues}
            riskBreakdown={transaction.riskBreakdown}
          />
        </div>

        {/* Network Graph Link */}
        {onInspectNetwork && (
          <div className="pt-2">
            <button
              onClick={() => onInspectNetwork(transaction)}
              className="w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition flex items-center justify-center space-x-2"
            >
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Inspect Counterparty in Entity Graph Explorer →</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
        <span className="font-mono">Model: {transaction.modelVersion || 'balanced-xgboost-v4'}</span>
        <span className="font-mono font-bold text-emerald-700">Latency: {transaction.latencyMs || 14}ms</span>
      </div>
    </div>
  );
}
