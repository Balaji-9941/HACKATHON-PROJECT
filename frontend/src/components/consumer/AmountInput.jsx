import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { formatCurrency } from '../../utils/api';

export default function AmountInput({ recipient, amount, setAmount, onProceed, onBack, preCheckAssessment, isEvaluating }) {
  const quickAmounts = [200, 500, 1500, 5000, 15000];

  const handleKey = (val) => {
    if (amount.length < 7) {
      setAmount((prev) => (prev === '0' ? val : prev + val));
    }
  };

  const handleBackspace = () => {
    setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : ''));
  };

  const numAmount = Number(amount) || 0;

  return (
    <div className="space-y-4 animate-fade-in text-slate-900">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-xs text-slate-500 font-medium">Paying</p>
          <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">{recipient?.name || recipient?.upiId}</p>
        </div>
        <div className="w-9" />
      </div>

      {/* Main Amount Display */}
      <div className="text-center py-4 space-y-1">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Amount (INR)</span>
        <div className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight flex items-center justify-center font-mono">
          <span className="text-slate-400 text-3xl mr-1">₹</span>
          <span>{amount || '0'}</span>
        </div>
        <p className="text-xs text-slate-500 font-mono mt-1 font-medium">
          {recipient?.upiId}
        </p>
      </div>

      {/* Real-time Pre-Check Gauge */}
      {preCheckAssessment && numAmount > 0 && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-between text-xs transition">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <span className="text-slate-700 font-medium">
              Risk: <strong className="text-slate-950 font-mono">{preCheckAssessment.totalRiskScore}/100</strong>
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-600 font-semibold flex items-center space-x-1">
            <Shield className="w-3 h-3 text-slate-500" />
            <span>Tier 1 Pre-Check ({preCheckAssessment.latencyMs || 2}ms)</span>
          </span>
        </div>
      )}

      {/* Quick Amount Pills */}
      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {quickAmounts.map((val) => (
          <button
            key={val}
            onClick={() => setAmount(String(val))}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shrink-0 transition shadow-xs"
          >
            +₹{val.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleKey(digit)}
            className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-lg border border-slate-200 shadow-card transition active:scale-98 font-mono"
          >
            {digit}
          </button>
        ))}
        <button
          onClick={() => handleKey('00')}
          className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm border border-slate-200 transition font-mono"
        >
          00
        </button>
        <button
          onClick={() => handleKey('0')}
          className="h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-lg border border-slate-200 shadow-card transition active:scale-98 font-mono"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold text-xs border border-slate-200 transition"
        >
          ⌫
        </button>
      </div>

      <div className="pt-2">
        <button
          onClick={onProceed}
          disabled={!amount || Number(amount) <= 0 || isEvaluating}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm shadow-card transition active:scale-98 flex items-center justify-center space-x-2"
        >
          {isEvaluating ? (
            <span>Evaluating telemetry...</span>
          ) : (
            <span>Proceed to Review</span>
          )}
        </button>
      </div>
    </div>
  );
}
