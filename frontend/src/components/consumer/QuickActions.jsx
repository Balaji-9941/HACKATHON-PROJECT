import React from 'react';
import { Send, Receipt, ShieldAlert, Store } from 'lucide-react';

export default function QuickActions({ onSendMoney, onOpenPassbook, onOpenSecurity, onSelectMerchant }) {
  const actions = [
    {
      id: 'send',
      label: 'Pay UPI ID',
      icon: Send,
      onClick: onSendMoney,
    },
    {
      id: 'passbook',
      label: 'Passbook',
      icon: Receipt,
      onClick: onOpenPassbook,
    },
    {
      id: 'merchants',
      label: 'Pay Merchant',
      icon: Store,
      onClick: onSelectMerchant,
    },
    {
      id: 'security',
      label: 'Security',
      icon: ShieldAlert,
      onClick: onOpenSecurity,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 py-1">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            onClick={act.onClick}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-card transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 mt-2 text-center group-hover:text-slate-950">
              {act.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
