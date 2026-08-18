import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Building, MapPin, Smartphone } from 'lucide-react';
import { formatCurrency, getRiskColor } from '../../utils/api';
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

  const riskStyle = getRiskColor(assessment?.alertSeverity);

  const handlePayClick = () => {
    if (assessment?.userFrictionLevel === 'confirm') {
      setIsMediumModalOpen(true);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-slate-900">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-sm font-bold text-slate-900">Payment Review</h3>
        <div className="w-9" />
      </div>

      {/* Recipient & Amount Card */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
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
          <span className="text-xs text-slate-500 font-medium">Total Transfer Amount</span>
          <span className="text-2xl font-black text-slate-950 font-mono">{formatCurrency(amount)}</span>
        </div>
      </div>

      {/* Graduated Friction: Banner (Low: 31-50) */}
      {assessment?.userFrictionLevel === 'banner' && (
        <RiskWarningModal
          isOpen={true}
          assessment={assessment}
          amount={amount}
          recipient={recipient}
        />
      )}

      {/* Telemetry Breakdown Details */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5 text-xs shadow-xs">
        <div className="flex justify-between items-center text-slate-500">
          <span className="flex items-center space-x-1.5 font-medium">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Paying from:</span>
          </span>
          <span className="text-slate-800 font-semibold">Axis Bank •••• 4892</span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span className="flex items-center space-x-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Location:</span>
          </span>
          <span className="text-slate-800 font-medium">{customer?.usualLocation || 'Bangalore, IN'}</span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span className="flex items-center space-x-1.5 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span>Device:</span>
          </span>
          <span className="text-slate-800 font-medium">{customer?.knownDevices?.[0] || 'Pixel-8-Pro'}</span>
        </div>
      </div>

      {/* Note input */}
      <div>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a reference note (optional)"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-xs"
        />
      </div>

      {/* Confirm Button */}
      <div className="pt-1">
        <button
          onClick={handlePayClick}
          disabled={isProcessing}
          className="w-full py-3 rounded-xl font-bold text-sm shadow-card transition active:scale-98 flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white"
        >
          {isProcessing ? (
            <span>Settling payment...</span>
          ) : (
            <>
              <span>Authorize & Pay {formatCurrency(amount)}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Medium Risk Modal */}
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
    </div>
  );
}
