import React, { useState } from 'react';
import { ShieldAlert, Fingerprint, X } from 'lucide-react';

export default function StepUpAuth({ isOpen, assessment, amount, recipient, onComplete, onCancel }) {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen || !assessment) return null;

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyStepUp(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const verifyStepUp = (enteredPin) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onComplete({ pinVerified: true, verifiedAt: new Date().toISOString() });
    }, 600);
  };

  const triggerBiometric = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onComplete({ biometricVerified: true, verifiedAt: new Date().toISOString() });
    }, 800);
  };

  const isCritical = assessment.userFrictionLevel === 'stepup_alert';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 p-6 shadow-modal space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                {isCritical ? 'Critical Step-Up' : 'PIN Challenge'}
              </span>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Score: {assessment.totalRiskScore}/100</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900">Enter 4-Digit Security PIN</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {assessment.fraudExplanation}
          </p>
        </div>

        {/* PIN Dots Indicator */}
        <div className="flex justify-center items-center space-x-4 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                pin.length > idx
                  ? 'bg-slate-900 border-slate-900 scale-110 shadow-xs'
                  : 'bg-slate-100 border-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={isVerifying}
              className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold text-base border border-slate-200 shadow-card transition active:scale-98 font-mono"
            >
              {num}
            </button>
          ))}
          <button
            onClick={triggerBiometric}
            disabled={isVerifying}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center border border-slate-200 transition"
            title="Biometric Auth"
          >
            <Fingerprint className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleKeyPress(0)}
            disabled={isVerifying}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold text-base border border-slate-200 shadow-card transition active:scale-98 font-mono"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={isVerifying}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 font-medium text-xs flex items-center justify-center border border-slate-200 transition"
          >
            Delete
          </button>
        </div>

        {isVerifying && (
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-700 py-1 font-medium">
            <div className="w-3 h-3 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
            <span>Verifying credentials...</span>
          </div>
        )}
      </div>
    </div>
  );
}
