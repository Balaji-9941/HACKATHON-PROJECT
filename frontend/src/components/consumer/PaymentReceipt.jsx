import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, Cpu, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, getRiskColor } from '../../utils/api';

export default function PaymentReceipt({ transaction, onDone }) {
  const [showAllFactors, setShowAllFactors] = useState(true);

  if (!transaction) return null;

  const riskStyle = getRiskColor(transaction.alertSeverity);
  const factors = transaction.explanationFactors || [];

  return (
    <div className="space-y-4 animate-fade-in text-slate-900">
      {/* Success Header */}
      <div className="text-center space-y-1.5 pt-2">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          Payment Settled Instantly
        </span>
        <h2 className="text-3xl font-black text-slate-900 font-mono tracking-tight">
          {formatCurrency(transaction.amount)}
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Paid to <strong className="text-slate-900">{transaction.recipientName || transaction.recipientUpiId}</strong>
        </p>
      </div>

      {/* Real-time ML Risk Intelligence Badge & All Factors */}
      <div className={`p-4 rounded-xl border ${riskStyle.bg} ${riskStyle.border} space-y-2.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900">
              XGBoost ML Risk Score: {transaction.totalRiskScore}/100
            </span>
          </div>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${riskStyle.badge}`}>
            {transaction.alertSeverity.toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-slate-800 leading-relaxed font-medium">
          {transaction.fraudExplanation}
        </p>

        {/* All 10 Factors Breakdown */}
        {factors.length > 0 && (
          <div className="pt-2 border-t border-slate-200/80 space-y-2">
            <button
              onClick={() => setShowAllFactors(!showAllFactors)}
              className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 hover:text-blue-700 transition"
            >
              <span>XGBoost Telemetry Factor Inspector ({factors.length} Signals Evaluated)</span>
              {showAllFactors ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAllFactors && (
              <div className="space-y-1.5 pt-1">
                {factors.map((f, i) => {
                  const isFlagged = f.status === 'flagged';
                  const isWarning = f.status === 'warning';
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border text-[11px] flex items-start space-x-2 ${
                        isFlagged
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : isWarning
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      {isFlagged ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{f.factor}</span>
                          <span className={`font-mono text-[10px] font-semibold px-1 rounded ${
                            isFlagged ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isFlagged ? `+${f.contribution} pts` : 'Verified (0 pts)'}
                          </span>
                        </div>
                        <p className="text-[10px] opacity-90 mt-0.5 leading-normal">{f.plainText}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600 font-mono">
          <span>Engine: <strong className="text-blue-700">Balanced XGBoost v4</strong></span>
          <span>Latency: <strong className="text-emerald-700 font-bold">{transaction.latencyMs || 12}ms</strong></span>
        </div>
      </div>

      {/* Transaction Metadata */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-card p-4 space-y-2.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Transaction ID</span>
          <span className="font-mono text-slate-900 font-bold">{transaction.transactionId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">UPI Reference No.</span>
          <span className="font-mono text-slate-700 font-medium">UPI-{transaction.transactionId.slice(-8)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Timestamp</span>
          <span className="text-slate-700">{new Date(transaction.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Location</span>
          <span className="text-slate-700">{transaction.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Hardware Verified</span>
          <span className="text-slate-700">{transaction.deviceName}</span>
        </div>
      </div>

      {/* Done Button */}
      <div className="pt-2">
        <button
          onClick={onDone}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition active:scale-[0.98]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
