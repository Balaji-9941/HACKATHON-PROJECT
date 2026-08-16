import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpRight, Shield, Zap, Sparkles, ChevronRight, Activity } from 'lucide-react';
import { fetchAPI, formatCurrency, getRiskColor } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';

export default function LiveStreamTable({ onSelectTransaction }) {
  const { latestTransaction, tier2Update } = useSocket();
  const [transactions, setTransactions] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    const loadInit = async () => {
      try {
        setLoading(true);
        const data = await fetchAPI('/transactions?limit=60');
        setTransactions(data.transactions || []);
      } catch (err) {
        console.error('[LiveStreamTable] Init error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadInit();
  }, []);

  // Real-time new transaction prepend from Socket.io
  useEffect(() => {
    if (!latestTransaction) return;
    setTransactions(prev => {
      const exists = prev.some(t => t.transactionId === latestTransaction.transactionId);
      if (exists) return prev;
      return [{ ...latestTransaction, isNewPulse: true }, ...prev.slice(0, 100)];
    });
  }, [latestTransaction]);

  // Real-time Tier 2 score updates from Socket.io
  useEffect(() => {
    if (!tier2Update) return;
    setTransactions(prev => prev.map(t => {
      if (t.transactionId === tier2Update.transactionId) {
        return {
          ...t,
          modelTier: tier2Update.modelTier,
          totalRiskScore: tier2Update.totalRiskScore,
          mlProbability: tier2Update.mlProbability,
          shapValues: tier2Update.shapValues,
          modelVersion: tier2Update.modelVersion,
          aiNarrative: tier2Update.aiNarrative
        };
      }
      return t;
    }));
  }, [tier2Update]);

  const filtered = transactions.filter(t => {
    const matchSearch = t.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
                        t.customerId?.toLowerCase().includes(search.toLowerCase()) ||
                        t.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
                        t.recipientUpiId?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (severityFilter !== 'ALL' && t.alertSeverity !== severityFilter.toLowerCase()) {
      return false;
    }

    if (sourceFilter !== 'ALL' && t.flowSource !== sourceFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-card p-5 space-y-4">
      {/* Header & Live Stream Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 block absolute inset-0" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Live Payments Telemetry Feed</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Socket.io Active
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Real-time sub-20ms Tier 1 scoring with asynchronous Tier 2 ML enrichment</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search txn / customer..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical (86-100)</option>
            <option value="high">High (71-85)</option>
            <option value="medium">Medium (51-70)</option>
            <option value="low">Low (31-50)</option>
            <option value="none">Normal (0-30)</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">All Sources</option>
            <option value="consumer">Consumer App</option>
            <option value="autoflow_replay">AutoFlow Replay</option>
            <option value="autoflow_scenario">AutoFlow Scenario</option>
            <option value="manual_injection">Manual Injection</option>
          </select>
        </div>
      </div>

      {/* Stream Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <th className="py-2.5 pl-3">Time</th>
              <th className="py-2.5">Txn ID / Customer</th>
              <th className="py-2.5">Counterparty</th>
              <th className="py-2.5 text-right">Amount</th>
              <th className="py-2.5 text-center">Score</th>
              <th className="py-2.5">Severity</th>
              <th className="py-2.5">Model Tier</th>
              <th className="py-2.5">Source</th>
              <th className="py-2.5 text-right pr-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                  Connecting to live telemetry pipe...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                  No matching transactions in current stream buffer.
                </td>
              </tr>
            ) : (
              filtered.map((txn) => {
                const risk = getRiskColor(txn.alertSeverity);
                return (
                  <tr
                    key={txn.transactionId}
                    onClick={() => onSelectTransaction(txn)}
                    className="hover:bg-slate-50 cursor-pointer transition group"
                  >
                    <td className="py-3 pl-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="py-3 whitespace-nowrap">
                      <p className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {txn.transactionId}
                      </p>
                      <p className="text-[11px] text-slate-500">{txn.customerId}</p>
                    </td>

                    <td className="py-3 whitespace-nowrap">
                      <p className="font-medium text-slate-800 truncate max-w-[140px]">
                        {txn.recipientName || txn.recipientUpiId}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                        {txn.location}
                      </p>
                    </td>

                    <td className="py-3 text-right font-extrabold text-slate-900 font-mono whitespace-nowrap">
                      {formatCurrency(txn.amount)}
                    </td>

                    <td className="py-3 text-center whitespace-nowrap">
                      <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded-md ${risk.bg} ${risk.text} border ${risk.border}`}>
                        {txn.totalRiskScore}
                      </span>
                    </td>

                    <td className="py-3 whitespace-nowrap">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase ${risk.badge}`}>
                        {txn.alertSeverity}
                      </span>
                    </td>

                    <td className="py-3 whitespace-nowrap">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                        txn.modelTier === 2
                          ? 'bg-blue-50 text-blue-800 border-blue-200 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {txn.modelTier === 2 ? 'Tier 2 (ML)' : 'Tier 1'}
                      </span>
                    </td>

                    <td className="py-3 whitespace-nowrap">
                      <span className="text-[10px] font-mono text-slate-500">
                        {txn.flowSource}
                      </span>
                    </td>

                    <td className="py-3 text-right pr-3 whitespace-nowrap">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs inline-flex items-center space-x-0.5">
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
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
