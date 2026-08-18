import React from 'react';
import { Shield, UserCheck, RefreshCw } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { formatCurrency } from '../../utils/api';

export default function ProfileScreen({ onSwitchToAdmin, onOpenSwitcher }) {
  const { activeCustomer, customers, refreshCustomer } = useCustomer();

  if (!activeCustomer) return null;

  const handleSelectCustomer = async (c) => {
    await refreshCustomer(c.customerId);
  };

  return (
    <div className="space-y-4 animate-fade-in text-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Profile & Accounts</h3>
        <button
          onClick={() => refreshCustomer(activeCustomer.customerId)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center space-x-1 text-xs"
          title="Refresh live balance"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[11px] font-medium">Sync</span>
        </button>
      </div>

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
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Switch Active Account</h4>
          {onOpenSwitcher && (
            <button
              onClick={onOpenSwitcher}
              className="text-[11px] text-blue-600 hover:underline font-bold"
            >
              View all ({customers.length})
            </button>
          )}
        </div>
        
        <div className="space-y-1.5">
          {customers.slice(0, 5).map((c) => {
            const isActive = c.customerId === activeCustomer.customerId;
            return (
              <button
                key={c.customerId}
                onClick={() => handleSelectCustomer(c)}
                className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="text-left">
                  <p className="font-semibold">{c.name} {isActive && '✓'}</p>
                  <p className={`text-[10px] font-mono ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>{c.upiId}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">{formatCurrency(c.balance || 0)}</p>
                  <p className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>{c.customerId}</p>
                </div>
              </button>
            );
          })}
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
