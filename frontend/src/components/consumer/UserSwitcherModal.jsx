import React from 'react';
import { X, Check, UserCheck, ShieldCheck, ChevronRight } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { formatCurrency } from '../../utils/api';

export default function UserSwitcherModal({ isOpen, onClose }) {
  const { activeCustomer, customers, refreshCustomer } = useCustomer();

  if (!isOpen) return null;

  const handleSelect = async (customer) => {
    await refreshCustomer(customer.customerId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Switch Consumer Account</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Note */}
        <div className="px-4 py-2 bg-blue-50/60 border-b border-blue-100/50 text-[11px] text-blue-800 flex items-center justify-between">
          <span>Select an account to test transfers & incoming credits</span>
          <span className="font-mono font-semibold">{customers.length} accounts</span>
        </div>

        {/* Customer List */}
        <div className="p-3 space-y-2 overflow-y-auto flex-1">
          {customers.map((c) => {
            const isActive = c.customerId === activeCustomer?.customerId;
            return (
              <button
                key={c.customerId}
                onClick={() => handleSelect(c)}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between group ${
                  isActive
                    ? 'bg-blue-50 border-blue-500/80 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full overflow-hidden border-2 flex items-center justify-center font-bold text-sm shrink-0 ${
                    isActive ? 'border-blue-600 bg-blue-100 text-blue-800' : 'border-slate-200 bg-slate-100 text-slate-700'
                  }`}>
                    {c.avatar && c.avatar.startsWith('http') ? (
                      <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{c.name?.charAt(0)}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                        {c.name}
                      </p>
                      {isActive && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-blue-600 text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 truncate">{c.upiId}</p>
                    <p className="text-[10px] text-slate-400">Avg: {formatCurrency(c.avgTransaction || 500)}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-extrabold font-mono text-slate-900">
                    {formatCurrency(c.balance || 0)}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">{c.customerId}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
