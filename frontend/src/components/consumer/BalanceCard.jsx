import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, QrCode } from 'lucide-react';
import { formatCurrency } from '../../utils/api';

export default function BalanceCard({ customer, onScanQR }) {
  const [showBalance, setShowBalance] = useState(true);

  if (!customer) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-card border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-slate-300" />
          </div>
          <div>
            <p className="text-xs text-slate-300 font-medium">Primary Account •••• 4892</p>
            <p className="text-xs font-mono text-slate-400">{customer.upiId}</p>
          </div>
        </div>
        <button
          onClick={onScanQR}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition"
          title="Scan QR"
        >
          <QrCode className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-6">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
          <span>Available Account Balance</span>
          <button onClick={() => setShowBalance(!showBalance)} className="hover:text-white">
            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-3xl font-bold tracking-tight text-white mt-1 font-mono">
          {showBalance ? formatCurrency(customer.balance) : '••••••••'}
        </p>
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center space-x-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          <span>Encrypted UPI Telemetry</span>
        </span>
        <span className="font-mono text-slate-300">
          Security Index: <strong className="text-white">{customer.securityScore || 92}/100</strong>
        </span>
      </div>
    </div>
  );
}
