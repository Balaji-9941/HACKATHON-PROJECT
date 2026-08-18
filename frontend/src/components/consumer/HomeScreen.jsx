import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Shield, ChevronRight, ExternalLink, ChevronDown, UserCheck } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { fetchAPI, formatCurrency, getRiskColor } from '../../utils/api';
import BalanceCard from './BalanceCard';
import QuickActions from './QuickActions';
import ContactGrid from './ContactGrid';
import SendMoneyFlow from './SendMoneyFlow';
import PassbookScreen from './PassbookScreen';
import SecurityCenter from './SecurityCenter';
import ProfileScreen from './ProfileScreen';
import BottomNav from './BottomNav';
import TransactionDetail from './TransactionDetail';
import UserSwitcherModal from './UserSwitcherModal';

export default function HomeScreen({ onSwitchToAdmin }) {
  const { activeCustomer, refreshCustomer, merchants } = useCustomer();
  const [activeTab, setActiveTab] = useState('home');
  const [isSendFlowOpen, setIsSendFlowOpen] = useState(false);
  const [preselectedRecipient, setPreselectedRecipient] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const loadRecentTransactions = async () => {
    if (!activeCustomer) return;
    try {
      const data = await fetchAPI(`/transactions?customerId=${activeCustomer.customerId}&limit=5`);
      setRecentTxns(data.transactions || []);
    } catch (err) {
      console.error('[HomeScreen] Error loading txns:', err.message);
    }
  };

  useEffect(() => {
    loadRecentTransactions();
  }, [activeCustomer]);

  const handleStartSend = (recipient = null) => {
    setPreselectedRecipient(recipient);
    setIsSendFlowOpen(true);
  };

  if (isSendFlowOpen) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 pb-20 text-slate-900">
        <SendMoneyFlow
          initialRecipient={preselectedRecipient}
          onClose={() => {
            setIsSendFlowOpen(false);
            setPreselectedRecipient(null);
            if (activeCustomer) refreshCustomer(activeCustomer.customerId);
            loadRecentTransactions();
          }}
          onPaymentComplete={() => {
            if (activeCustomer) refreshCustomer(activeCustomer.customerId);
            loadRecentTransactions();
          }}
        />
      </div>
    );
  }

  if (selectedTxn) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 pb-20 text-slate-900">
        <TransactionDetail
          transaction={selectedTxn}
          onBack={() => setSelectedTxn(null)}
          onAcknowledge={(id) => {
            setRecentTxns((prev) =>
              prev.map((t) => (t.transactionId === id ? { ...t, userAcknowledgedAt: new Date() } : t))
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 pb-20">
      <div className="space-y-4">
        {/* Top Header with Clickable Account Switcher */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setIsSwitcherOpen(true)}
            className="flex items-center space-x-2.5 p-1.5 -ml-1.5 rounded-2xl hover:bg-slate-200/70 transition group text-left"
            title="Click to switch account"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-600 bg-slate-100 flex items-center justify-center font-bold text-slate-800 shadow-xs group-hover:scale-105 transition">
              {activeCustomer?.avatar && activeCustomer.avatar.startsWith('http') ? (
                <img src={activeCustomer.avatar} alt={activeCustomer.name} className="w-full h-full object-cover" />
              ) : (
                <span>{activeCustomer?.name?.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <p className="text-[11px] text-slate-500 font-medium">Good day,</p>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md border border-blue-100 flex items-center space-x-0.5 group-hover:bg-blue-100 transition">
                  <span>Switch</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-950 leading-tight group-hover:text-blue-600 transition">
                {activeCustomer?.name}
              </h2>
            </div>
          </button>

          <button
            onClick={onSwitchToAdmin}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs text-blue-700 font-semibold transition shadow-xs"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Investigator Portal</span>
            <ExternalLink className="w-3 h-3 text-blue-500" />
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Balance Card */}
            <BalanceCard customer={activeCustomer} onScanQR={() => handleStartSend()} />

            {/* Quick Actions */}
            <QuickActions
              onSendMoney={() => handleStartSend()}
              onOpenPassbook={() => setActiveTab('passbook')}
              onOpenSecurity={() => setActiveTab('security')}
              onSelectMerchant={() => {
                const merch = merchants[0];
                if (merch) handleStartSend(merch);
                else handleStartSend();
              }}
            />

            {/* Contacts Horizontal Grid */}
            <ContactGrid
              contacts={activeCustomer?.savedContacts || []}
              onSelectContact={(c) => handleStartSend(c)}
              onNewContact={() => handleStartSend()}
            />

            {/* Recent Activity List (User's real transactions only) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Transactions</h3>
                <button
                  onClick={() => setActiveTab('passbook')}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  View all
                </button>
              </div>

              {recentTxns.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-1 shadow-card">
                  <p className="text-xs font-bold text-slate-800">No transactions yet</p>
                  <p className="text-[11px] text-slate-500">Send money to any contact or merchant to begin!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTxns.map((txn) => {
                    const isIncoming = txn.recipientUpiId && activeCustomer?.upiId && 
                                       txn.recipientUpiId.toLowerCase() === activeCustomer.upiId.toLowerCase() &&
                                       txn.customerId !== activeCustomer.customerId;

                    return (
                      <button
                        key={txn.transactionId}
                        onClick={() => setSelectedTxn(txn)}
                        className="w-full p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs hover:shadow-card flex items-center justify-between transition group text-left"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                            isIncoming ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            <ArrowUpRight className={`w-4 h-4 ${isIncoming ? 'rotate-180 text-emerald-600' : 'text-rose-600'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700 transition">
                              {isIncoming ? `Received from ${txn.customerId}` : (txn.recipientName || txn.recipientUpiId)}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {new Date(txn.timestamp).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <div className="text-right">
                            <p className={`text-xs font-extrabold font-mono ${
                              isIncoming ? 'text-emerald-600' : 'text-slate-900'
                            }`}>
                              {isIncoming ? `+${formatCurrency(txn.amount)}` : `-${formatCurrency(txn.amount)}`}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">
                              Risk: {txn.totalRiskScore}/100
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'passbook' && <PassbookScreen onBack={() => setActiveTab('home')} />}
        {activeTab === 'security' && <SecurityCenter customer={activeCustomer} />}
        {activeTab === 'profile' && <ProfileScreen onSwitchToAdmin={onSwitchToAdmin} onOpenSwitcher={() => setIsSwitcherOpen(true)} />}
      </div>

      {/* Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* User Switcher Modal */}
      <UserSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => {
          setIsSwitcherOpen(false);
          loadRecentTransactions();
        }}
      />
    </div>
  );
}
