import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { formatCurrency } from '../../utils/api';

export default function RiskWarningModal({ isOpen, assessment, amount, recipient, onConfirm, onCancel }) {
  if (!isOpen || !assessment) return null;

  const isBanner = assessment.userFrictionLevel === 'banner';

  if (isBanner) {
    return (
      <div className="rounded-xl p-3 bg-slate-100 border border-slate-200 text-slate-800 flex items-start space-x-3 text-xs mb-3 shadow-xs">
        <AlertTriangle className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-slate-900">Pattern Variance Notice</p>
          <p className="text-slate-600 mt-0.5 leading-relaxed">{assessment.fraudExplanation}</p>
        </div>
      </div>
    );
  }

  // Medium Risk Explicit Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 shadow-modal space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 text-slate-800 border border-slate-200">
            Telemetry Anomaly ({assessment.totalRiskScore}/100)
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-1.5">Verify Payment Intent</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            {assessment.fraudExplanation}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Recipient:</span>
            <span className="text-slate-900 font-semibold">{recipient?.name || recipient?.upiId}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Amount:</span>
            <span className="text-slate-900 font-bold font-mono">{formatCurrency(amount)}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
          >
            Confirm & Authorize Transfer
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 transition"
          >
            Cancel Payment
          </button>
        </div>
      </div>
    </div>
  );
}
