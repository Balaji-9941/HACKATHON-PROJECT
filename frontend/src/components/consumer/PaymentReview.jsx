import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Building, MapPin, Smartphone, Cpu, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showAllFactors, setShowAllFactors] = useState(true);

  const riskStyle = getRiskColor(assessment?.alertSeverity);
  const factors = assessment?.explanationFactors || [];

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
          <span className="text-xs text-slate-500 font-medium">Total Transfer Amount</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(amount)}</span>
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

      {/* XGBoost Fraud Classification Inference Box with All Factors */}
      <div className={`p-4 rounded-xl border ${riskStyle.bg} ${riskStyle.border} space-y-2.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900">
              XGBoost ML Risk Score: {assessment?.totalRiskScore || 0}/100
            </span>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${riskStyle.badge}`}>
            {assessment?.alertSeverity || 'NONE'}
          </span>
        </div>

        <p className="text-xs text-slate-800 leading-relaxed font-medium">
          {assessment?.fraudExplanation}
        </p>

        {/* Expandable Factor Breakdown for Full Factor Transparency */}
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

        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Engine: <strong className="text-blue-700">Balanced XGBoost v4</strong></span>
          <span>Latency: <strong className="text-emerald-700 font-bold">{assessment?.latencyMs || assessment?.serverLatencyMs || 12}ms</strong></span>
        </div>
      </div>

      {/* Note input */}
      <div>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (e.g. Split dinner)"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
        />
      </div>

      {/* Confirm Button */}
      <div className="pt-1">
        <button
          onClick={handlePayClick}
          disabled={isProcessing}
          className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center space-x-2 ${
            assessment?.alertSeverity === 'critical' || assessment?.alertSeverity === 'high'
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isProcessing ? (
            <span>Settling payment...</span>
          ) : (
            <>
              <span>Confirm & Pay {formatCurrency(amount)}</span>
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
