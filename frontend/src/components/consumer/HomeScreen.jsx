import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Shield, ShieldAlert, Sparkles, ChevronRight, ExternalLink } from 'lucide-react';
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

export default function HomeScreen({ onSwitchToAdmin }) {
  const { activeCustomer, refreshCustomer, merchants } = useCustomer();
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'passbook', 'security', 'profile'
  const [isSendFlowOpen, setIsSendFlowOpen] = useState(false);
  const [preselectedRecipient, setPreselectedRecipient] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);

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
            loadRecentTransactions();
          }}
          onPaymentComplete={() => {
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
            setRecentTxns(prev => prev.map(t => t.transactionId === id ? { ...t, userAcknowledgedAt: new Date() } : t));
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 pb-20">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-600 bg-slate-100 flex items-center justify-center font-bold text-slate-800 shadow-xs">
              {activeCustomer?.avatar && activeCustomer.avatar.startsWith('http') ? (
                <img src={activeCustomer.avatar} alt={activeCustomer.name} className="w-full h-full object-cover" />
              ) : (
                <span>{activeCustomer?.name?.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Good day,</p>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">{activeCustomer?.name}</h2>
            </div>
          </div>

          <button
            onClick={onSwitchToAdmin}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-slate-900 font-semibold transition shadow-xs"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Investigator Portal</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
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

            {/* Recent Activity List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Transactions</h3>
                <button
                  onClick={() => setActiveTab('passbook')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View all
                </button>
              </div>

              <div className="space-y-2">
                {recentTxns.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-xs font-medium">
                    No transactions yet. Tap "Pay UPI ID" to test payment telemetry.
                  </div>
                ) : (
                  recentTxns.map((txn) => {
                    const risk = getRiskColor(txn.alertSeverity);
                    return (
                      <button
                        key={txn.transactionId}
                        onClick={() => setSelectedTxn(txn)}
                        className="w-full p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs hover:shadow-card flex items-center justify-between transition group text-left"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                            <ArrowUpRight className="w-5 h-5 text-rose-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700 transition">
                              {txn.recipientName || txn.recipientUpiId}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {new Date(txn.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <div className="text-right">
                            <p className="text-xs font-extrabold text-slate-900 font-mono">-{formatCurrency(txn.amount)}</p>
                            <div className="flex items-center justify-end space-x-1 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                txn.totalRiskScore <= 30 ? 'bg-emerald-600' :
                                txn.totalRiskScore <= 50 ? 'bg-yellow-500' :
                                txn.totalRiskScore <= 70 ? 'bg-amber-500' : 'bg-rose-600'
                              }`} />
                              <span className="text-[10px] font-mono text-slate-500 font-semibold">{txn.totalRiskScore}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'passbook' && <PassbookScreen onBack={() => setActiveTab('home')} />}
        {activeTab === 'security' && <SecurityCenter />}
        {activeTab === 'profile' && <ProfileScreen onSwitchToAdmin={onSwitchToAdmin} />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
