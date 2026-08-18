import React from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatCurrency, getRiskColor } from '../../utils/api';

export default function PaymentReceipt({ transaction, onDone }) {
  if (!transaction) return null;

  const riskStyle = getRiskColor(transaction.alertSeverity);

  return (
    <div className="space-y-4 animate-fade-in text-slate-900">
      {/* Success Header */}
      <div className="text-center space-y-1.5 pt-2">
        <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-900 shadow-xs">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-800 border border-slate-200">
          Payment Settled
        </span>
        <h2 className="text-3xl font-black text-slate-950 font-mono tracking-tight">
          {formatCurrency(transaction.amount)}
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Paid to <strong className="text-slate-900">{transaction.recipientName || transaction.recipientUpiId}</strong>
        </p>
      </div>

      {/* Real-time Risk Intelligence Badge */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <span className="text-xs font-bold text-slate-900">
              PayTelemetry Score: {transaction.totalRiskScore}/100
            </span>
          </div>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${riskStyle.badge}`}>
            {transaction.alertSeverity.toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {transaction.fraudExplanation}
        </p>

        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Tier {transaction.modelTier} Engine</span>
          <span>{transaction.latencyMs || 12}ms Latency</span>
        </div>
      </div>

      {/* Transaction Metadata */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-card p-4 space-y-2.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Transaction ID</span>
          <span className="font-mono text-slate-900 font-bold">{transaction.transactionId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">UPI Ref</span>
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
          <span className="text-slate-500">Device</span>
          <span className="text-slate-700">{transaction.deviceName}</span>
        </div>
      </div>

      {/* Done Button */}
      <div className="pt-2">
        <button
          onClick={onDone}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-card transition active:scale-98"
        >
          Done
        </button>
      </div>
    </div>
  );
}
