import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ZAxis, Cell } from 'recharts';
import { ScatterChart as ScatterIcon } from 'lucide-react';
import { fetchAPI, formatCurrency } from '../../utils/api';

export default function AnomalyScatter({ onSelectTransaction }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTxns = async () => {
      try {
        setLoading(true);
        const res = await fetchAPI('/transactions?limit=120');
        const points = (res.transactions || []).map((t) => ({
          transactionId: t.transactionId,
          amount: t.amount,
          riskScore: t.totalRiskScore,
          severity: t.alertSeverity,
          customer: t.customerId,
          recipient: t.recipientName || t.recipientUpiId,
          rawTxn: t,
        }));
        setData(points);
      } catch (e) {
        console.error('[AnomalyScatter] Error:', e.message);
      } finally {
        setLoading(false);
      }
    };
    loadTxns();
  }, []);

  const getColor = (sev) => {
    switch (sev) {
      case 'critical':
        return '#dc2626'; // Vivid Red
      case 'high':
        return '#ea580c'; // Orange
      case 'medium':
        return '#d97706'; // Amber
      case 'low':
        return '#2563eb'; // Blue
      default:
        return '#16a34a'; // Emerald Green
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-modal text-xs space-y-1">
          <p className="font-mono font-bold text-slate-900">{p.transactionId}</p>
          <p className="text-slate-600">
            Amount: <strong className="text-slate-900 font-mono">{formatCurrency(p.amount)}</strong>
          </p>
          <p className="text-slate-600">
            Risk Score: <strong className="font-mono text-blue-700 font-bold">{p.riskScore}/100</strong>
          </p>
          <p className="text-slate-500 text-[11px]">Paid to: {p.recipient}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <ScatterIcon className="w-4 h-4 text-blue-600" />
            <span>Multivariate Risk vs Amount Scatter Space</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Transaction Value (INR) vs Real-Time Anomaly Score (0-100)</p>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-medium text-slate-600">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Normal (0-30)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Medium (31-70)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span>High/Critical (&gt;70)</span>
          </span>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="amount"
              name="Amount"
              unit="₹"
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="number"
              dataKey="riskScore"
              name="Risk Score"
              unit=" pts"
              domain={[0, 100]}
              stroke="#94a3b8"
              fontSize={11}
            />
            <ZAxis range={[50, 140]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              data={data}
              onClick={(e) => onSelectTransaction && onSelectTransaction(e.rawTxn)}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.severity)} fillOpacity={0.85} stroke="#ffffff" strokeWidth={1} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
