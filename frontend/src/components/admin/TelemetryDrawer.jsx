import React from 'react';
import { X, ShieldAlert, Cpu, Activity, ExternalLink, Smartphone, MapPin, Clock, User, Layers } from 'lucide-react';
import { formatCurrency, getRiskColor } from '../../utils/api';
import ScoreBreakdownChart from './ScoreBreakdownChart';

export default function TelemetryDrawer({ transaction, onClose, onInspectNetwork }) {
  if (!transaction) return null;

  const risk = getRiskColor(transaction.alertSeverity);
  const riskBreakdown = transaction.riskBreakdown || {};

  const signals = [
    { label: 'Amount Anomaly', score: riskBreakdown.amountAnomaly || 0, max: 20 },
    { label: 'Velocity Burst', score: riskBreakdown.velocityBurst || 0, max: 20 },
    { label: 'Device Novelty', score: riskBreakdown.deviceNovelty || 0, max: 15 },
    { label: 'Location Variance', score: riskBreakdown.locationVariance || 0, max: 15 },
    { label: 'Temporal Deviation', score: riskBreakdown.temporalDeviation || 0, max: 10 },
    { label: 'Merchant Risk', score: riskBreakdown.merchantRisk || 0, max: 10 },
    { label: 'Network Consistency', score: riskBreakdown.networkConsistency || 0, max: 10 },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white border-l border-slate-200 shadow-modal flex flex-col justify-between animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs text-slate-500 font-bold">{transaction.transactionId}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase ${risk.badge}`}>
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

        {/* Hypothesis / Explanation Box */}
        <div className={`p-4 rounded-xl border space-y-1.5 ${risk.bg} ${risk.border}`}>
          <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>XGBoost Fraud Classification Inference:</span>
          </span>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {transaction.fraudExplanation || 'Standard telemetry profile within baseline boundaries.'}
          </p>

          {/* AI Narrative if available */}
          {transaction.aiNarrative && (
            <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed shadow-xs">
              <span className="font-bold text-blue-700 block mb-1">AI Narrative Synthesis:</span>
              <p className="italic font-medium">{transaction.aiNarrative}</p>
            </div>
          )}
        </div>

        {/* 7 Telemetry Factors Meter */}
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
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SHAP Waterfall / Feature Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            TreeSHAP Feature Attribution Waterfall
          </h4>
          <ScoreBreakdownChart transaction={transaction} />
        </div>

        {/* Technical Context Table */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Context & Metadata</h4>
          <div className="flex justify-between">
            <span className="text-slate-500">Payer Customer:</span>
            <span className="font-mono text-slate-900 font-bold">{transaction.customerId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Counterparty:</span>
            <span className="font-semibold text-slate-900">{transaction.recipientName || transaction.recipientUpiId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Hardware ID:</span>
            <span className="font-mono text-slate-700">{transaction.deviceId} ({transaction.deviceName})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Location Origin:</span>
            <span className="text-slate-700">{transaction.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Model Engine:</span>
            <span className="font-mono text-blue-700 font-bold">XGBoost ML ({transaction.modelVersion || 'xgboost-ml-v3'})</span>
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <button
          onClick={() => {
            if (onInspectNetwork && transaction.customerId) {
              onInspectNetwork(transaction.customerId);
            }
          }}
          className="px-3.5 py-2 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-blue-700 font-semibold text-xs flex items-center space-x-1.5 transition shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Inspect Customer Network</span>
        </button>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
}
