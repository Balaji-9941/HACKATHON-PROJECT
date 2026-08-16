import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, UserCheck, ExternalLink, MessageSquare, History } from 'lucide-react';
import { fetchAPI, formatCurrency, getRiskColor } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ScoreBreakdownChart from './ScoreBreakdownChart';

export default function AlertDetail({ alertData, onBack, onInspectNetwork, onInspectTransaction }) {
  const { user } = useAuth();
  const [alert, setAlert] = useState(alertData);
  const [transaction, setTransaction] = useState(null);
  const [status, setStatus] = useState(alertData.status || 'Open');
  const [assignedTo, setAssignedTo] = useState(alertData.assignedTo || 'unassigned');
  const [notes, setNotes] = useState(alertData.resolutionNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadTxn = async () => {
      if (!alertData.transactionId) return;
      try {
        const txn = await fetchAPI(`/transactions/${alertData.transactionId}`);
        setTransaction(txn);
      } catch (e) {
        console.warn('[AlertDetail] Txn fetch error:', e.message);
      }
    };
    loadTxn();
  }, [alertData]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await fetchAPI(`/admin/alerts/${alert.alertId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          assignedTo,
          resolutionNotes: notes
        })
      });
      setAlert(updated);
      window.alert('Incident status and audit record saved.');
    } catch (e) {
      window.alert(`Save error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const risk = getRiskColor(alert.severity);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center space-x-1.5 text-xs font-semibold shadow-xs">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Triage Queue</span>
        </button>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-md ${risk.badge}`}>
            {alert.severity.toUpperCase()} SEVERITY
          </span>
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-md bg-white text-slate-700 border border-slate-200 shadow-xs">
            {alert.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Details & Telemetry */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header Summary */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-slate-500">Case Reference: {alert.alertId}</p>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  Incident on {alert.customerName} ({alert.customerId})
                </h2>
              </div>
              <span className="text-2xl font-black text-rose-700 font-mono">
                {alert.riskScoreAtCreation}/100 Risk
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-slate-800">
              <p className="font-bold text-rose-800 mb-1">Triggered Fraud Hypothesis:</p>
              <p className="leading-relaxed font-medium">{alert.fraudExplanation}</p>
            </div>
          </div>

          {/* Scored Transaction Details */}
          {transaction && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Underlying Transaction Telemetry</h3>
                <button
                  onClick={() => onInspectTransaction && onInspectTransaction(transaction)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                >
                  <span>Open Full Inspector</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Amount</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(transaction.amount)}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Counterparty</span>
                  <span className="text-xs font-bold text-slate-900 truncate block">{transaction.recipientName}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Location</span>
                  <span className="text-xs font-medium text-slate-800 truncate block">{transaction.location}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Hardware</span>
                  <span className="text-xs font-medium text-slate-800 truncate block">{transaction.deviceName}</span>
                </div>
              </div>

              {/* Waterfall Factors Breakdown */}
              <div className="pt-2">
                <ScoreBreakdownChart transaction={transaction} />
              </div>
            </div>
          )}

          {/* Linked Alerts */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Correlated Entity Incidents</h3>
            {alert.linkedAlerts?.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No prior unresolved incidents directly linked to this customer node.</p>
            ) : (
              <div className="space-y-1.5">
                {alert.linkedAlerts.map((linkId, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-blue-700 flex items-center justify-between font-medium">
                    <span>{linkId}</span>
                    <span className="text-[10px] text-slate-500 font-sans">Correlated by device / identity graph</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Triage Resolution & Decision Workflow */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Analyst Case Resolution</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Triage Decision / Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
              >
                <option value="Open">Open (Pending Review)</option>
                <option value="Investigating">Investigating (Under Active Analysis)</option>
                <option value="Resolved">Resolved (Confirmed Fraud Action Taken)</option>
                <option value="False Positive">False Positive (Benign Behavior)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Assigned Analyst</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Investigation Notes & Evidence</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Document findings, counterparty verification, or mule ring connections..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition"
            >
              {isSaving ? 'Recording Audit Trail...' : 'Update & Log Audit Decision'}
            </button>
          </div>

          {/* Quick Network Graph Navigation */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
            <h4 className="text-xs font-bold text-blue-900">Network Counterparty Discovery</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Inspect upstream fund sources and downstream cash-out mule nodes for this customer.
            </p>
            <button
              onClick={() => onInspectNetwork(alert.customerId)}
              className="w-full py-2 rounded-lg bg-white hover:bg-blue-100 border border-blue-300 text-blue-800 font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Inspect Account Graph</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
