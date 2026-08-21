import React from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { formatCurrency } from '../../utils/api';

export default function PaymentReceipt({ transaction, onDone }) {
  if (!transaction) return null;

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

      {/* Security Status Badge */}
      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex items-center space-x-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <div className="flex-1 text-xs font-medium">
          <span>Encrypted UPI 2.0 Settlement Verified</span>
        </div>
      </div>

      {/* Transaction Metadata Card */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-2.5 text-xs">
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Transaction ID</span>
          <span className="font-mono text-slate-800 font-bold">{transaction.transactionId}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Recipient UPI ID</span>
          <span className="font-mono text-slate-800 font-medium">{transaction.recipientUpiId}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Date & Time</span>
          <span className="text-slate-800 font-medium">{new Date(transaction.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-500 font-medium">Status</span>
          <span className="text-emerald-700 font-bold flex items-center space-x-1">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Success & Completed</span>
          </span>
        </div>
      </div>

      {/* Done Button */}
      <button
        onClick={onDone}
        className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
      >
        <span>Back to Home</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
