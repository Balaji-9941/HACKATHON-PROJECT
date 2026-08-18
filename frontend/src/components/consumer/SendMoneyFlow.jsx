import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { fetchAPI } from '../../utils/api';
import { useCustomer } from '../../context/CustomerContext';
import AmountInput from './AmountInput';
import PaymentReview from './PaymentReview';
import StepUpAuth from './StepUpAuth';
import PaymentReceipt from './PaymentReceipt';

export default function SendMoneyFlow({ initialRecipient = null, onClose, onPaymentComplete }) {
  const { activeCustomer, refreshCustomer, merchants } = useCustomer();

  const [step, setStep] = useState(initialRecipient ? 'amount' : 'recipient');
  const [recipient, setRecipient] = useState(initialRecipient || null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [preCheckAssessment, setPreCheckAssessment] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStepUpOpen, setIsStepUpOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);

  useEffect(() => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0 || !recipient || !activeCustomer) {
      setPreCheckAssessment(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsEvaluating(true);
        const data = await fetchAPI('/transactions/pre-check', {
          method: 'POST',
          body: JSON.stringify({
            customerId: activeCustomer.customerId,
            amount: numAmount,
            recipientUpiId: recipient.upiId,
            recipientName: recipient.name,
            location: activeCustomer.usualLocation,
            deviceId: activeCustomer.knownDevices?.[0] || 'dev-pixel-8',
            deviceName: 'Pixel-8-Pro',
            merchantCategory: recipient.category || 'peer_to_peer',
          }),
        });
        setPreCheckAssessment(data.riskAssessment);
      } catch (err) {
        console.error('[PreCheck error]:', err.message);
      } finally {
        setIsEvaluating(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [amount, recipient, activeCustomer]);

  const handleSelectRecipient = (rec) => {
    setRecipient(rec);
    setStep('amount');
  };

  const handleProceedToReview = () => {
    setStep('review');
  };

  const handleConfirmPayment = async () => {
    if (!preCheckAssessment) return;

    if (['stepup', 'stepup_alert'].includes(preCheckAssessment.userFrictionLevel)) {
      setIsStepUpOpen(true);
      return;
    }

    executeSettlement();
  };

  const executeSettlement = async (stepUpData = null) => {
    try {
      setIsProcessing(true);
      const res = await fetchAPI('/transactions/confirm', {
        method: 'POST',
        body: JSON.stringify({
          customerId: activeCustomer.customerId,
          amount: Number(amount),
          recipientUpiId: recipient.upiId,
          recipientName: recipient.name || recipient.upiId,
          merchantCategory: recipient.category || 'peer_to_peer',
          location: activeCustomer.usualLocation,
          deviceId: activeCustomer.knownDevices?.[0] || 'dev-pixel-8',
          deviceName: 'Pixel-8-Pro',
          note,
          flowSource: 'consumer',
          userAcknowledgedAt: stepUpData?.verifiedAt || null,
        }),
      });

      setCompletedTransaction(res.transaction);
      setStep('receipt');
      await refreshCustomer(activeCustomer.customerId);
      if (onPaymentComplete) onPaymentComplete(res.transaction);
    } catch (err) {
      alert(`Payment settlement error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setIsStepUpOpen(false);
    }
  };

  const filteredContacts = (activeCustomer?.savedContacts || []).filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.upiId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMerchants = (merchants || []).filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.upiId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-50 text-slate-900 min-h-full">
      {step === 'recipient' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-900">Send Money via UPI</h3>
            <div className="w-9" />
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter name, UPI ID, or phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-xs"
            />
          </div>

          {/* Custom UPI ID Quick Add if query has @ */}
          {searchQuery.includes('@') && (
            <button
              onClick={() => handleSelectRecipient({ name: searchQuery, upiId: searchQuery, category: 'peer_to_peer' })}
              className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs text-slate-900 hover:bg-slate-200 transition font-medium"
            >
              <span>Pay to <strong>{searchQuery}</strong></span>
              <span className="font-bold text-slate-950">Select →</span>
            </button>
          )}

          {/* Saved Contacts */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Saved Contacts</h4>
            <div className="space-y-1.5">
              {filteredContacts.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectRecipient(c)}
                  className="w-full p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center space-x-3 transition group text-left shadow-card"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-800 group-hover:border-slate-900 transition">
                    {c.avatar && c.avatar.startsWith('http') ? (
                      <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{c.avatar || c.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:underline transition">{c.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{c.upiId}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Verified Merchants */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Verified Businesses</h4>
            <div className="space-y-1.5">
              {filteredMerchants.slice(0, 5).map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectRecipient(m)}
                  className="w-full p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center space-x-3 transition group text-left shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-base">
                    <span>{m.logo || '🏬'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.name}</p>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono font-medium">Tier {m.riskTier}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{m.upiId}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'amount' && (
        <AmountInput
          recipient={recipient}
          amount={amount}
          setAmount={setAmount}
          onProceed={handleProceedToReview}
          onBack={() => setStep('recipient')}
          preCheckAssessment={preCheckAssessment}
          isEvaluating={isEvaluating}
        />
      )}

      {step === 'review' && (
        <PaymentReview
          recipient={recipient}
          amount={Number(amount)}
          customer={activeCustomer}
          assessment={preCheckAssessment}
          note={note}
          setNote={setNote}
          onConfirm={handleConfirmPayment}
          onBack={() => setStep('amount')}
          isProcessing={isProcessing}
        />
      )}

      {step === 'receipt' && (
        <PaymentReceipt
          transaction={completedTransaction}
          onDone={onClose}
        />
      )}

      {/* Step-Up PIN Modal */}
      <StepUpAuth
        isOpen={isStepUpOpen}
        assessment={preCheckAssessment}
        amount={Number(amount)}
        recipient={recipient}
        onComplete={(stepUpData) => executeSettlement(stepUpData)}
        onCancel={() => setIsStepUpOpen(false)}
      />
    </div>
  );
}
