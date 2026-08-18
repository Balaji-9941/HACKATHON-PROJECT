import React, { useState, useEffect } from 'react';
import { Kanban } from 'lucide-react';
import { fetchAPI, getRiskColor } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function InvestigationBoard({ onSelectAlert }) {
  const { user } = useAuth();
  const { latestAlert } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { id: 'Open', label: 'Open Triage', badgeColor: 'bg-slate-100 text-slate-900 border-slate-300' },
    { id: 'Investigating', label: 'Under Investigation', badgeColor: 'bg-slate-100 text-slate-800 border-slate-300' },
    { id: 'Resolved', label: 'Resolved (Confirmed Fraud)', badgeColor: 'bg-slate-100 text-slate-800 border-slate-300' },
    { id: 'False Positive', label: 'False Positive (Benign)', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' },
  ];

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/admin/alerts?limit=100');
      setAlerts(data || []);
    } catch (e) {
      console.error('[InvestigationBoard] Error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (!latestAlert) return;
    setAlerts((prev) => {
      const exists = prev.some((a) => a.alertId === latestAlert.alertId);
      if (exists) return prev;
      return [latestAlert, ...prev];
    });
  }, [latestAlert]);

  const moveAlert = async (alertId, newStatus, e) => {
    e?.stopPropagation();
    try {
      setAlerts((prev) => prev.map((a) => (a.alertId === alertId ? { ...a, status: newStatus } : a)));

      const updated = await fetchAPI(`/admin/alerts/${alertId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          assignedTo: user?.username || 'analyst1',
        }),
      });

      setAlerts((prev) => prev.map((a) => (a.alertId === alertId ? updated : a)));
    } catch (err) {
      alert(`Move error: ${err.message}`);
      loadAlerts();
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Kanban className="w-4 h-4 text-slate-700" />
            <span>Fraud Operations Incident Kanban</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Drag or advance incidents across investigation stages with automated audit tracking</p>
        </div>
        <span className="text-xs font-mono text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs font-semibold">
          {alerts.length} Active Cases
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colAlerts = alerts.filter((a) => a.status === col.id);
          return (
            <div
              key={col.id}
              className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-3 min-h-[500px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${col.badgeColor}`}>
                  {col.label}
                </span>
                <span className="text-xs font-mono text-slate-700 font-bold">{colAlerts.length}</span>
              </div>

              {/* Cards Container */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[620px] pr-0.5">
                {colAlerts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12 italic">No incidents in this stage</p>
                ) : (
                  colAlerts.map((card) => {
                    const risk = getRiskColor(card.severity);
                    return (
                      <div
                        key={card.alertId}
                        onClick={() => onSelectAlert(card)}
                        className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer space-y-2 shadow-card hover:shadow-card-hover group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-slate-600 group-hover:underline font-bold">
                            {card.alertId}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase ${risk.badge}`}>
                            {card.severity}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate">{card.customerName}</p>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                            {card.fraudExplanation}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 font-medium">
                          <span>Risk: <strong className="text-slate-900 font-mono">{card.riskScoreAtCreation}</strong></span>
                          <span>{card.assignedTo || 'unassigned'}</span>
                        </div>

                        {/* Quick Move State Select */}
                        <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={card.status}
                            onChange={(e) => moveAlert(card.alertId, e.target.value, e)}
                            className="w-full px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-medium focus:bg-white focus:outline-none focus:border-slate-900"
                          >
                            <option value="Open">Stage → Open</option>
                            <option value="Investigating">Stage → Investigating</option>
                            <option value="Resolved">Stage → Resolved</option>
                            <option value="False Positive">Stage → False Positive</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
