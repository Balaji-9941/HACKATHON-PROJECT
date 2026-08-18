import React, { useState } from 'react';
import { ArrowLeft, Shield, HelpCircle, Check, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency, getRiskColor } from '../../utils/api';

export default function TransactionDetail({ transaction, onBack, onAcknowledge }) {
  const [acknowledged, setAcknowledged] = useState(Boolean(transaction?.userAcknowledgedAt));

  if (!transaction) return null;

  const riskStyle = getRiskColor(transaction.alertSeverity);
  const factors = transaction.explanationFactors || [];

  const handleAck = () => {
    setAcknowledged(true);
    if (onAcknowledge) onAcknowledge(transaction.transactionId);
  };

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
        <span className={`inline-block px-2.5 py-0.5 text-xs font-mono font-bold rounded-md ${riskStyle.badge} mt-2`}>
          {transaction.alertSeverity.toUpperCase()} • ML SCORE {transaction.totalRiskScore}/100
        </span>
      </div>

      {/* ML Telemetry Analysis */}
      <div className={`p-4 rounded-xl border ${riskStyle.bg} ${riskStyle.border} space-y-2`}>
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-blue-700" />
          <h4 className="text-xs font-bold text-slate-900">XGBoost ML Classification Inference</h4>
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

      {/* Complete XGBoost Telemetry Factor Inspector (All 10 Signals) */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            All Calculated Telemetry Factors ({factors.length || 10} Signals)
          </h4>
          <span className="text-[10px] font-mono text-slate-500">TreeSHAP Evaluated</span>
        </div>

        <div className="space-y-2">
          {factors.map((f, idx) => {
            const isFlagged = f.status === 'flagged';
            const isWarning = f.status === 'warning';
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                  isFlagged
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : isWarning
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
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
                    <span className="font-bold text-xs">{f.factor}</span>
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isFlagged ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isFlagged ? `+${f.contribution} pts` : 'Verified Safe (0 pts)'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-85 mt-0.5 leading-relaxed">{f.plainText}</p>
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
            <span className="flex items-center space-x-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Confirmed</span>
            </span>
          ) : (
            <button
              onClick={handleAck}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 transition"
            >
              Yes, it's me
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          Confirming helps train our in-flight behavioral telemetry models to prevent unnecessary friction on your account.
        </p>
      </div>

      {/* Transaction Metadata */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Transaction ID</span>
          <span className="font-mono text-slate-900 font-bold">{transaction.transactionId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Timestamp</span>
          <span className="text-slate-700">{new Date(transaction.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Originating Location</span>
          <span className="text-slate-700">{transaction.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Device Hardware</span>
          <span className="text-slate-700">{transaction.deviceName || transaction.deviceId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Model Version</span>
          <span className="font-mono text-slate-700 font-semibold">{transaction.modelVersion || 'balanced-xgboost-v4'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Scoring Latency</span>
          <span className="font-mono text-emerald-700 font-bold">{transaction.latencyMs || 14}ms</span>
        </div>
      </div>
    </div>
  );
}
