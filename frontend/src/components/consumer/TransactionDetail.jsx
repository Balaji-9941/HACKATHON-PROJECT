import React, { useState } from 'react';
import { ArrowLeft, Shield, HelpCircle, Check } from 'lucide-react';
import { formatCurrency, getRiskColor } from '../../utils/api';

export default function TransactionDetail({ transaction, onBack, onAcknowledge }) {
  const [acknowledged, setAcknowledged] = useState(Boolean(transaction?.userAcknowledgedAt));

  if (!transaction) return null;

  const riskStyle = getRiskColor(transaction.alertSeverity);

  const handleAck = () => {
    setAcknowledged(true);
    if (onAcknowledge) onAcknowledge(transaction.transactionId);
  };

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
    <div className="space-y-4 animate-fade-in text-slate-900">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-sm font-bold text-slate-900">Transaction Details</h3>
        <div className="w-9" />
      </div>

      {/* Header Summary */}
      <div className="text-center p-5 rounded-2xl bg-white border border-slate-200 shadow-card space-y-1.5">
        <span className="text-xs text-slate-500 font-medium">Paid to</span>
        <h2 className="text-base font-bold text-slate-900 truncate">{transaction.recipientName || transaction.recipientUpiId}</h2>
        <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">{formatCurrency(transaction.amount)}</p>
        <span className={`inline-block px-2.5 py-0.5 text-xs font-mono rounded-md ${riskStyle.badge} mt-2`}>
          {transaction.alertSeverity.toUpperCase()} • SCORE {transaction.totalRiskScore}/100
        </span>
      </div>

      {/* Why this was flagged */}
      <div className={`p-4 rounded-xl border ${riskStyle.bg} ${riskStyle.border} space-y-1.5`}>
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-slate-800" />
          <h4 className="text-xs font-bold text-slate-900">Telemetry Analysis</h4>
        </div>
        <p className="text-xs text-slate-800 leading-relaxed font-medium">
          {transaction.fraudExplanation}
        </p>

        {/* AI Narrative if available */}
        {transaction.aiNarrative && (
          <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 italic shadow-xs">
            <span className="font-semibold text-blue-700 not-italic">AI Synthesis: </span>
            {transaction.aiNarrative}
          </div>
        )}
      </div>

      {/* 7-Factor Risk Telemetry Meter */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">7-Factor Telemetry Attribution</h4>
        <div className="space-y-2">
          {signals.map((sig, idx) => {
            const ratio = sig.score / sig.max;
            const barColor = ratio > 0.6 ? 'bg-rose-600' : ratio > 0.3 ? 'bg-amber-500' : 'bg-emerald-500';
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">{sig.label}</span>
                  <span className="font-mono text-slate-800 font-semibold">{sig.score}/{sig.max}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
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

      {/* Consumer Acknowledgement */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900">Recognize this transfer?</h4>
          </div>
          {acknowledged ? (
            <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>Confirmed by you</span>
            </span>
          ) : (
            <button
              onClick={handleAck}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Yes, it was me
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          Confirming recognized transactions refines your account baseline and reduces unnecessary verification prompts.
        </p>
      </div>

      {/* Technical Metadata */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Transaction ID:</span>
          <span className="font-mono text-slate-900 font-semibold">{transaction.transactionId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Hardware ID:</span>
          <span className="text-slate-800 font-medium">{transaction.deviceId} ({transaction.deviceName})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Location:</span>
          <span className="text-slate-800 font-medium">{transaction.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Timestamp:</span>
          <span className="text-slate-800">{new Date(transaction.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Scoring Engine:</span>
          <span className="font-mono text-blue-700 font-bold">Tier {transaction.modelTier} ({transaction.modelVersion})</span>
        </div>
      </div>
    </div>
  );
}
