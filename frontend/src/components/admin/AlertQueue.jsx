import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, Search, Filter, ChevronRight, UserCheck } from 'lucide-react';
import { fetchAPI, getRiskColor } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export default function AlertQueue({ onSelectAlert }) {
  const { latestAlert } = useSocket();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/admin/alerts?limit=50');
      setAlerts(data || []);
    } catch (err) {
      console.error('[AlertQueue] Failed to load alerts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // Prepend real-time alert from Socket.io
  useEffect(() => {
    if (!latestAlert) return;
    setAlerts(prev => {
      const exists = prev.some(a => a.alertId === latestAlert.alertId);
      if (exists) return prev;
      return [latestAlert, ...prev];
    });
  }, [latestAlert]);

  const handleQuickStatusChange = async (alertId, newStatus, e) => {
    e.stopPropagation();
    try {
      const updated = await fetchAPI(`/admin/alerts/${alertId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          assignedTo: user?.username || 'analyst1'
        })
      });
      setAlerts(prev => prev.map(a => a.alertId === alertId ? updated : a));
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const filtered = alerts.filter(a => {
    const matchSearch = a.alertId?.toLowerCase().includes(search.toLowerCase()) ||
                        a.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
                        a.customerId?.toLowerCase().includes(search.toLowerCase()) ||
                        a.customerName?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <span>Investigator Incident Triage Queue</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono text-[10px] border border-rose-200 font-bold">
              {filtered.length} Incidents
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Prioritized security alerts triaged from elevated and critical risk telemetry</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alert / customer..."
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
            <option value="False Positive">False Positive</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <th className="py-2.5 pl-3">Alert ID</th>
              <th className="py-2.5">Customer</th>
              <th className="py-2.5">Severity</th>
              <th className="py-2.5">Risk Score</th>
              <th className="py-2.5">Status</th>
              <th className="py-2.5">Assigned Analyst</th>
              <th className="py-2.5">Created</th>
              <th className="py-2.5 text-right pr-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">Loading alert queue...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">No active alerts match current filters.</td>
              </tr>
            ) : (
              filtered.map(alert => {
                const risk = getRiskColor(alert.severity);
                return (
                  <tr
                    key={alert.alertId}
                    onClick={() => onSelectAlert(alert)}
                    className="hover:bg-slate-50 cursor-pointer transition group"
                  >
                    <td className="py-3 pl-3 font-mono font-bold text-slate-900 group-hover:text-blue-600">
                      {alert.alertId}
                    </td>
                    <td className="py-3">
                      <p className="font-bold text-slate-900">{alert.customerName}</p>
                      <p className="text-[10px] font-mono text-slate-500">{alert.customerId}</p>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase ${risk.badge}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-extrabold text-slate-900">
                      {alert.riskScoreAtCreation}/100
                    </td>
                    <td className="py-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                        alert.status === 'Open' ? 'bg-red-50 text-red-700 border-red-200' :
                        alert.status === 'Investigating' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        alert.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-700">
                      {alert.assignedTo || 'unassigned'}
                    </td>
                    <td className="py-3 text-slate-500 text-[11px]">
                      {new Date(alert.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-right pr-3">
                      <select
                        value={alert.status}
                        onChange={(e) => handleQuickStatusChange(alert.alertId, e.target.value, e)}
                        className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-medium focus:bg-white focus:outline-none"
                      >
                        <option value="Open">Open</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Resolved">Resolved</option>
                        <option value="False Positive">False Positive</option>
                      </select>
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
