import React from 'react';
import { Plus } from 'lucide-react';

export default function ContactGrid({ contacts = [], onSelectContact, onNewContact }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">People & Frequent Payees</h3>
        <span className="text-[11px] text-slate-500 font-medium">Tap to pay</span>
      </div>

      <div className="flex space-x-3 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={onNewContact}
          className="flex flex-col items-center justify-center min-w-[68px] space-y-1.5 group"
        >
          <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 group-hover:border-slate-900 flex items-center justify-center bg-white text-slate-600 group-hover:text-slate-900 transition shadow-xs">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-600 font-medium truncate w-16 text-center">New Payee</span>
        </button>

        {contacts.map((contact, idx) => (
          <button
            key={idx}
            onClick={() => onSelectContact(contact)}
            className="flex flex-col items-center justify-center min-w-[68px] space-y-1.5 group"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 group-hover:border-slate-900 transition bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-800 shadow-xs">
              {contact.avatar && contact.avatar.startsWith('http') ? (
                <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
              ) : (
                <span>{contact.avatar || contact.name?.charAt(0)}</span>
              )}
            </div>
            <span className="text-[11px] text-slate-700 font-semibold truncate w-16 text-center group-hover:text-slate-950">
              {contact.name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
