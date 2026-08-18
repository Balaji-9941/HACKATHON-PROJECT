import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, ArrowUpRight, CheckCircle2, ChevronRight, Pause, Play } from 'lucide-react';
import { fetchAPI, formatCurrency, getRiskColor } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';

export default function LiveStreamTable({ onSelectTransaction }) {
  const { latestTransaction } = useSocket();
  const [transactions, setTransactions] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRecent = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/transactions?limit=60');
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('[LiveStreamTable] Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecent();
  }, []);

  // Prepend real-time stream packet from Socket.io
  useEffect(() => {
    if (!latestTransaction || isPaused) return;
    setTransactions((prev) => [latestTransaction, ...prev.slice(0, 75)]);
  }, [latestTransaction, isPaused]);

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
      t.customerId?.toLowerCase().includes(search.toLowerCase()) ||
      t.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
      t.recipientUpiId?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (filterSeverity === 'ALL') return true;
    return t.alertSeverity?.toLowerCase() === filterSeverity.toLowerCase();
  });

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-card p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <span>In-Flight Telemetry Event Stream</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200 font-semibold">
              {filtered.length} Events
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Real-time evaluated transactions scored across Tier 1 rules and Tier 2 ML</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Pause / Resume Stream */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition ${
              isPaused
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? 'Resume Stream' : 'Freeze View'}</span>
          </button>

          {/* Search Filter */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search txn / customer / UPI..."
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-900"
          />

          {/* Severity Dropdown */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical Anomaly</option>
            <option value="high">High Variance</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
            <option value="normal">Normal (Cleared)</option>
          </select>
        </div>
      </div>

      {/* High Density Telemetry Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <th className="py-2.5 pl-3">Transaction ID</th>
              <th className="py-2.5">Payer Account</th>
              <th className="py-2.5">Recipient / Merchant</th>
              <th className="py-2.5 text-right">Amount (INR)</th>
              <th className="py-2.5 text-center">Score</th>
              <th className="py-2.5">Severity</th>
              <th className="py-2.5">Friction Policy</th>
              <th className="py-2.5">Engine Tier</th>
              <th className="py-2.5 text-right pr-3">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">Loading telemetry feed...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">No matching transactions in current buffer.</td>
              </tr>
            ) : (
              filtered.map((t) => {
                const risk = getRiskColor(t.alertSeverity);
                return (
                  <tr
                    key={t.transactionId}
                    onClick={() => onSelectTransaction(t)}
                    className="hover:bg-slate-50 cursor-pointer transition group"
                  >
                    <td className="py-2.5 pl-3 font-mono font-bold text-slate-900 group-hover:underline">
                      {t.transactionId}
                    </td>
                    <td className="py-2.5 font-mono text-slate-700">
                      {t.customerId}
                    </td>
                    <td className="py-2.5">
                      <p className="font-semibold text-slate-900 truncate max-w-[160px]">{t.recipientName || t.recipientUpiId}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">{t.recipientUpiId}</p>
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-950">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-2.5 text-center font-mono font-bold text-slate-900">
                      {t.totalRiskScore}/100
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase ${risk.badge}`}>
                        {t.alertSeverity}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-700 capitalize">
                      {t.userFrictionLevel || 'none'}
                    </td>
                    <td className="py-2.5 text-[11px] text-slate-600 font-mono">
                      Tier {t.modelTier || 1}
                    </td>
                    <td className="py-2.5 text-right pr-3 font-mono text-slate-600 font-medium">
                      {t.latencyMs || 12}ms
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
