import React from 'react';
import { Send, ArrowDownLeft, Receipt, ShieldAlert, Store } from 'lucide-react';

export default function QuickActions({ onSendMoney, onOpenPassbook, onOpenSecurity, onSelectMerchant }) {
  const actions = [
    {
      id: 'send',
      label: 'Pay UPI ID',
      icon: Send,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      onClick: onSendMoney
    },
    {
      id: 'passbook',
      label: 'Passbook',
      icon: Receipt,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      onClick: onOpenPassbook
    },
    {
      id: 'merchants',
      label: 'Pay Merchant',
      icon: Store,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      onClick: onSelectMerchant
    },
    {
      id: 'security',
      label: 'Security',
      icon: ShieldAlert,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      onClick: onOpenSecurity
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 py-1">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            onClick={act.onClick}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs hover:shadow-card transition group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${act.color} group-hover:scale-105 transition`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 mt-2 text-center group-hover:text-slate-900">
              {act.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
