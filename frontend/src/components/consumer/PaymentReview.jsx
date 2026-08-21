import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Building, MapPin, Smartphone, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import { formatCurrency } from '../../utils/api';
import RiskWarningModal from './RiskWarningModal';

export default function PaymentReview({
  recipient,
  amount,
  customer,
  assessment,
  note,
  setNote,
  onConfirm,
  onBack,
  isProcessing,
}) {
  const [isMediumModalOpen, setIsMediumModalOpen] = useState(false);

  const isRisky = assessment && (assessment.totalRiskScore >= 50 || ['high', 'critical', 'medium'].includes(assessment.alertSeverity));
  const isHighRisk = assessment && (assessment.totalRiskScore >= 70 || ['high', 'critical'].includes(assessment.alertSeverity));

  const handlePayClick = () => {
    if (assessment?.userFrictionLevel === 'confirm') {
      setIsMediumModalOpen(true);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-sm font-bold text-slate-900">Payment Review</h3>
        <div className="w-9" />
      </div>

      {/* Recipient & Amount Card */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-800">
            {recipient?.avatar && recipient.avatar.startsWith('http') ? (
              <img src={recipient.avatar} alt={recipient.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <span>{recipient?.avatar || recipient?.name?.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">{recipient?.name || recipient?.upiId}</h4>
            <p className="text-xs text-slate-500 font-mono truncate">{recipient?.upiId}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
          <span className="text-xs text-slate-500 font-medium">Transfer Amount</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(amount)}</span>
        </div>
      </div>

      {/* Clear, Simple Security Verification Status for User (No Technical Scores) */}
      {isRisky ? (
        <div className={`p-4 rounded-xl border space-y-2 ${
          isHighRisk ? 'bg-rose-50/80 border-rose-200 text-rose-950' : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-4 h-4 ${isHighRisk ? 'text-rose-600' : 'text-amber-600'}`} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isHighRisk ? 'Security Verification Required' : 'Payment Advisory'}
            </span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            {isHighRisk
              ? 'This transfer requires additional biometric authentication before processing to safeguard your account.'
              : 'Please double-check the recipient details before confirming this payment.'}
          </p>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1 text-xs font-medium">
            <span>Verified & Protected by Real-Time Payment Security</span>
          </div>
        </div>
      )}

      {/* Note Input */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-card space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-600 uppercase">Payment Note (Optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Monthly rent, Dinner share"
          className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
        />
      </div>

      {/* Security Context Info */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center space-x-1">
          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
          <span>{customer?.knownDevices?.[0]?.includes('iphone') ? 'iPhone 15 Pro' : customer?.knownDevices?.[0]?.includes('galaxy') ? 'Galaxy S24 Ultra' : 'Pixel 8 Pro'}</span>
        </span>
        <span className="flex items-center space-x-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{customer?.usualLocation || 'Bangalore, IN'}</span>
        </span>
        <span className="flex items-center space-x-1">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit Encrypted</span>
        </span>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          onClick={handlePayClick}
          disabled={isProcessing}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <span>{isProcessing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Medium Risk Warning Modal */}
      {isMediumModalOpen && (
        <RiskWarningModal
          isOpen={isMediumModalOpen}
          assessment={assessment}
          amount={amount}
          recipient={recipient}
          onConfirm={() => {
            setIsMediumModalOpen(false);
            onConfirm();
          }}
          onCancel={() => setIsMediumModalOpen(false)}
        />
      )}
    </div>
  );
}
