import React from 'react';
import { User, Shield, Phone, CreditCard, ChevronRight, LogOut } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export default function ProfileScreen({ onSwitchToAdmin }) {
  const { activeCustomer, customers, setActiveCustomer } = useCustomer();

  if (!activeCustomer) return null;

  return (
    <div className="space-y-4 animate-fade-in text-slate-900">
      <h3 className="text-base font-bold text-slate-900">Profile & Accounts</h3>

      {/* Customer Avatar & Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-card text-center space-y-3">
        <div className="w-18 h-18 rounded-full overflow-hidden mx-auto border-2 border-blue-600 bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-800 shadow-sm">
          {activeCustomer.avatar && activeCustomer.avatar.startsWith('http') ? (
            <img src={activeCustomer.avatar} alt={activeCustomer.name} className="w-full h-full object-cover" />
          ) : (
            <span>{activeCustomer.name?.charAt(0)}</span>
          )}
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900">{activeCustomer.name}</h2>
          <p className="text-xs text-blue-700 font-mono font-medium mt-0.5">{activeCustomer.upiId}</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            Account Age: {activeCustomer.accountAgeDays || 420} Days
          </span>
        </div>
      </div>

      {/* Customer Account Switcher for Demo evaluation */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-2">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Switch Demo Consumer Account</h4>
        <div className="space-y-1.5">
          {customers.map(c => (
            <button
              key={c.customerId}
              onClick={() => setActiveCustomer(c)}
              className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                c.customerId === activeCustomer.customerId
                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{c.name} ({c.customerId})</span>
              <span className="font-mono text-[10px]">Tier {c.networkRiskTier || 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Switch to Investigator Console */}
      <div className="pt-2">
        <button
          onClick={onSwitchToAdmin}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
        >
          <Shield className="w-4 h-4" />
          <span>Switch to Investigator Command Center →</span>
        </button>
      </div>
    </div>
  );
}
