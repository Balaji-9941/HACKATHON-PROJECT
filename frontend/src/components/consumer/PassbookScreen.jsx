import React, { useState, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { fetchAPI, formatCurrency, getRiskColor } from '../../utils/api';
import { useCustomer } from '../../context/CustomerContext';
import TransactionDetail from './TransactionDetail';

export default function PassbookScreen({ onBack }) {
  const { activeCustomer } = useCustomer();
  const [transactions, setTransactions] = useState([]);
  const [filterTab, setFilterTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    if (!activeCustomer) return;
    try {
      setLoading(true);
      const data = await fetchAPI(`/transactions?customerId=${activeCustomer.customerId}&limit=100`);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('[Passbook] Failed to load transactions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [activeCustomer]);

  if (selectedTxn) {
    return (
      <TransactionDetail
        transaction={selectedTxn}
        onBack={() => setSelectedTxn(null)}
        onAcknowledge={(id) => {
          setTransactions((prev) =>
            prev.map((t) => (t.transactionId === id ? { ...t, userAcknowledgedAt: new Date() } : t))
          );
        }}
      />
    );
  }

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
      t.recipientUpiId?.toLowerCase().includes(search.toLowerCase()) ||
      t.transactionId?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (filterTab === 'RISKY') return t.totalRiskScore > 50 || ['high', 'critical'].includes(t.alertSeverity);
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in text-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Passbook & History</h3>
        <span className="text-xs font-mono text-slate-500 font-medium">{filtered.length} entries</span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
        {['ALL', 'RISKY'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`flex-1 py-1.5 rounded-lg font-medium transition ${
              filterTab === tab ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'RISKY' ? '⚠️ Elevated Anomaly' : 'All Transactions'}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500 font-medium">Loading ledger records...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-medium">No matching transactions found</div>
        ) : (
          filtered.map((txn) => {
            const isIncoming = txn.recipientUpiId && activeCustomer?.upiId && 
                               txn.recipientUpiId.toLowerCase() === activeCustomer.upiId.toLowerCase() &&
                               txn.customerId !== activeCustomer.customerId;

            return (
              <button
                key={txn.transactionId}
                onClick={() => setSelectedTxn(txn)}
                className="w-full p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs hover:shadow-card flex items-center justify-between transition group text-left"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                    isIncoming ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    {isIncoming ? (
                      <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-rose-600" />
                    )}
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
                    <div className="flex items-center justify-end space-x-1 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          txn.totalRiskScore <= 30
                            ? 'bg-emerald-600'
                            : txn.totalRiskScore <= 50
                            ? 'bg-yellow-500'
                            : txn.totalRiskScore <= 70
                            ? 'bg-amber-500'
                            : 'bg-rose-600'
                        }`}
                      />
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">{txn.totalRiskScore}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
