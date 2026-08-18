import React from 'react';
import { Shield } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { formatCurrency } from '../../utils/api';

export default function ProfileScreen({ onSwitchToAdmin }) {
  const { activeCustomer, customers, setActiveCustomer, refreshCustomer } = useCustomer();

  if (!activeCustomer) return null;

  const handleSelectCustomer = async (c) => {
    await refreshCustomer(c.customerId);
  };

  return (
    <div className="space-y-4 animate-fade-in text-slate-900">
      <h3 className="text-base font-bold text-slate-900">Profile & Accounts</h3>

      {/* Customer Avatar & Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-card text-center space-y-3">
        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-blue-600 bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-800 shadow-xs">
          {activeCustomer.avatar && activeCustomer.avatar.startsWith('http') ? (
            <img src={activeCustomer.avatar} alt={activeCustomer.name} className="w-full h-full object-cover" />
          ) : (
            <span>{activeCustomer.name?.charAt(0)}</span>
          )}
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-950">{activeCustomer.name}</h2>
          <p className="text-xs text-blue-700 font-mono font-medium mt-0.5">{activeCustomer.upiId}</p>
          <div className="mt-2 flex items-center justify-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
              Balance: {formatCurrency(activeCustomer.balance || 0)}
            </span>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-800 border border-blue-200">
              {activeCustomer.accountAgeDays || 420} Days
            </span>
          </div>
        </div>
      </div>

      {/* Customer Account Switcher for Demo evaluation */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-2">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Switch Demo Consumer Account</h4>
        <div className="space-y-1.5">
          {customers.slice(0, 10).map((c) => (
            <button
              key={c.customerId}
              onClick={() => handleSelectCustomer(c)}
              className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                c.customerId === activeCustomer.customerId
                  ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="text-left">
                <p className="font-semibold">{c.name}</p>
                <p className="text-[10px] font-mono opacity-80">{c.upiId}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">{formatCurrency(c.balance || 0)}</p>
                <p className="text-[10px] opacity-75">{c.customerId}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Switch to Investigator Console */}
      <div className="pt-2">
        <button
          onClick={onSwitchToAdmin}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-card transition flex items-center justify-center space-x-2"
        >
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Switch to Investigator Command Center →</span>
        </button>
      </div>
    </div>
  );
}
