import React, { useState, useEffect } from 'react';
import { X, Shield, Cpu, Sparkles, MapPin, Smartphone, Clock, ArrowRight, ExternalLink, HelpCircle } from 'lucide-react';
import { fetchAPI, formatCurrency, getRiskColor } from '../../utils/api';
import ScoreBreakdownChart from './ScoreBreakdownChart';

export default function TelemetryDrawer({ transaction, onClose, onInspectNetwork }) {
  const [customerBaseline, setCustomerBaseline] = useState(null);
  const [loadingBaseline, setLoadingBaseline] = useState(false);

  useEffect(() => {
    if (!transaction?.customerId) return;
    const fetchBaseline = async () => {
      try {
        setLoadingBaseline(true);
        const data = await fetchAPI(`/admin/customers/${transaction.customerId}/baseline`);
        setCustomerBaseline(data.customer);
      } catch (e) {
        console.warn('[TelemetryDrawer] Baseline fetch error:', e.message);
      } finally {
        setLoadingBaseline(false);
      }
    };
    fetchBaseline();
  }, [transaction]);

  if (!transaction) return null;

  const riskStyle = getRiskColor(transaction.alertSeverity);
  const isTier2 = transaction.modelTier === 2;

  const signals = [
    { label: 'Amount Anomaly', val: transaction.riskBreakdown?.amountAnomaly || 0, max: 20 },
    { label: 'Velocity Burst', val: transaction.riskBreakdown?.velocityBurst || 0, max: 20 },
    { label: 'Device Novelty', val: transaction.riskBreakdown?.deviceNovelty || 0, max: 15 },
    { label: 'Location Variance', val: transaction.riskBreakdown?.locationVariance || 0, max: 15 },
    { label: 'Temporal Deviation', val: transaction.riskBreakdown?.temporalDeviation || 0, max: 10 },
    { label: 'Merchant Risk', val: transaction.riskBreakdown?.merchantRisk || 0, max: 10 },
    { label: 'Network Consistency', val: transaction.riskBreakdown?.networkConsistency || 0, max: 10 }
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slide-left">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${riskStyle.bg} ${riskStyle.border} ${riskStyle.text}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Telemetry Inspector</h3>
            <p className="text-[11px] font-mono text-slate-500">{transaction.transactionId}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Risk Score & Model Tier Badges */}
        <div className={`p-4 rounded-xl border ${riskStyle.bg} ${riskStyle.border} space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-extrabold font-mono ${riskStyle.text}`}>
                {transaction.totalRiskScore}
              </span>
              <span className="text-xs text-slate-500 font-mono font-medium">/ 100 Risk</span>
            </div>
            <div className="flex space-x-2">
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-md ${riskStyle.badge}`}>
                {transaction.alertSeverity.toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-md border ${
                isTier2
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {isTier2 ? 'Tier 2 (ML + SHAP)' : 'Tier 1 (Rules)'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {transaction.fraudExplanation}
          </p>

          {/* AI Narrative if available */}
          {transaction.aiNarrative && (
            <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 space-y-1 shadow-xs">
              <div className="flex items-center space-x-1.5 text-blue-700 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Narrative Synthesis</span>
              </div>
              <p className="italic">{transaction.aiNarrative}</p>
            </div>
          )}

          {transaction.isSimulatedScenario && (
            <div className="text-[11px] font-mono text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
              Scenario Trigger: <strong>{transaction.scenarioType || 'Injected Pattern'}</strong>
            </div>
          )}
        </div>

        {/* 7 Deterministic Signals Meter */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">7-Signal Telemetry Weights</h4>
          <div className="space-y-2">
            {signals.map((sig, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">{sig.label}</span>
                  <span className="font-mono text-slate-800 font-semibold">{sig.val}/{sig.max}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      sig.val === 0 ? 'bg-slate-300' :
                      sig.val / sig.max > 0.6 ? 'bg-rose-600' :
                      sig.val / sig.max > 0.3 ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${(sig.val / sig.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explainable Waterfall Chart */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <ScoreBreakdownChart transaction={transaction} />
        </div>

        {/* Baseline vs Actual Comparison */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Customer Baseline vs Actual Parameter</h4>
          <div className="space-y-1.5">
            <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-500">
              <span>Parameter</span>
              <span>Baseline</span>
              <span>Current Txn</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 text-[11px] border-b border-slate-200">
              <span className="text-slate-700 font-medium">Amount</span>
              <span className="text-slate-500 font-mono">₹{customerBaseline?.avgTransaction || 500}</span>
              <span className="text-slate-900 font-mono font-bold">{formatCurrency(transaction.amount)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 text-[11px] border-b border-slate-200">
              <span className="text-slate-700 font-medium">Location</span>
              <span className="text-slate-500 truncate">{customerBaseline?.usualLocation || 'Bangalore, IN'}</span>
              <span className="text-slate-900 truncate font-semibold">{transaction.location}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 text-[11px]">
              <span className="text-slate-700 font-medium">Hardware</span>
              <span className="text-slate-500 truncate">{customerBaseline?.knownDevices?.[0] || 'dev-pixel-8'}</span>
              <span className="text-slate-900 truncate font-semibold">{transaction.deviceName}</span>
            </div>
          </div>
        </div>

        {/* Ground Truth & Metadata */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Dataset Ground Truth:</span>
            <span className={`font-mono font-bold ${transaction.groundTruthLabel === 1 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {transaction.groundTruthLabel === 1 ? 'FRAUD (Class 1)' : 'LEGITIMATE (Class 0)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Flow Source:</span>
            <span className="font-mono text-slate-700 font-semibold">{transaction.flowSource}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Telemetry Latency:</span>
            <span className="font-mono text-emerald-700 font-bold">{transaction.latencyMs || 12}ms</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-white flex space-x-2">
        <button
          onClick={() => onInspectNetwork(transaction.customerId)}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Inspect in Fraud Network Graph</span>
        </button>
      </div>
    </div>
  );
}
