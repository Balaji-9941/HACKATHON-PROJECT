import React from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { formatCurrency } from '../../utils/api';

export default function TransactionDetail({ transaction, onBack }) {
  if (!transaction) return null;

  return (
    <div className="space-y-4 animate-fade-in text-slate-900">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-sm font-bold text-slate-900">Transaction Details</h3>
        <div className="w-9" />
      </div>

      {/* Hero Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-card text-center space-y-1">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 mb-2 shadow-xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <span className="text-xs text-slate-500 font-medium">Payment to</span>
        <h2 className="text-base font-bold text-slate-900 truncate">{transaction.recipientName || transaction.recipientUpiId}</h2>
        <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">{formatCurrency(transaction.amount)}</p>
        <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 mt-2">
          Settled Instantly via UPI 2.0
        </span>
      </div>

      {/* Transaction Properties */}
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
          <span className="text-slate-500 font-medium">Timestamp</span>
          <span className="text-slate-800 font-medium">{new Date(transaction.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Category</span>
          <span className="text-slate-800 font-medium capitalize">{transaction.merchantCategory || 'peer_to_peer'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Origin Location</span>
          <span className="text-slate-800 font-medium">{transaction.location || 'Bangalore, IN'}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-500 font-medium">Security Status</span>
          <span className="text-emerald-700 font-bold flex items-center space-x-1">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Encrypted & Verified</span>
          </span>
        </div>
      </div>
    </div>
  );
}
