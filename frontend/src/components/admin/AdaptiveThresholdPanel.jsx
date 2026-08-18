import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw } from 'lucide-react';
import { fetchAPI } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';

export default function AdaptiveThresholdPanel() {
  const { thresholdUpdate } = useSocket();
  const [metrics, setMetrics] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tData, sData] = await Promise.all([
        fetchAPI('/admin/thresholds'),
        fetchAPI('/admin/performance'),
      ]);
      setMetrics(tData);
      setSnapshots(sData || []);
    } catch (e) {
      console.error('[AdaptiveThresholdPanel] Error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!thresholdUpdate) return;
    setMetrics((prev) => ({
      ...prev,
      thresholds: thresholdUpdate.thresholds,
      precision: thresholdUpdate.metrics?.precision || prev?.precision,
      recall: thresholdUpdate.metrics?.recall || prev?.recall,
      f1: thresholdUpdate.metrics?.f1 || prev?.f1,
    }));
  }, [thresholdUpdate]);

  const handleRecalibrate = async () => {
    try {
      setIsRecalibrating(true);
      const res = await fetchAPI('/admin/thresholds/recalibrate', { method: 'POST' });
      setMetrics(res.metrics);
      if (res.snapshot) {
        setSnapshots((prev) => [res.snapshot, ...prev.slice(0, 15)]);
      }
    } catch (e) {
      alert(`Recalibration error: ${e.message}`);
    } finally {
      setIsRecalibrating(false);
    }
  };

  const thresholds = metrics?.thresholds || { low: 30, medium: 50, high: 70, critical: 85 };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Adaptive Threshold Auto-Tuning Engine</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Dynamically optimizes severity cutoffs against live precision & recall trade-offs</p>
        </div>

        <button
          onClick={handleRecalibrate}
          disabled={isRecalibrating}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs flex items-center space-x-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRecalibrating ? 'animate-spin' : ''}`} />
          <span>{isRecalibrating ? 'Calibrating F1...' : 'Recalibrate Now'}</span>
        </button>
      </div>

      {/* Threshold Bands Indicator */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Current Active Severity Threshold Bands</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
            <span className="text-[10px] text-blue-800 block uppercase font-bold">Low (Banner)</span>
            <span className="text-2xl font-black text-blue-900 font-mono">0 – {thresholds.low}</span>
            <span className="text-[10px] text-blue-700 block font-medium">Subtle UX warning banner</span>
          </div>

          <div className="p-3.5 rounded-xl bg-yellow-50/70 border border-yellow-200 space-y-1">
            <span className="text-[10px] text-yellow-800 block uppercase font-bold">Medium (Confirm)</span>
            <span className="text-2xl font-black text-yellow-900 font-mono">{thresholds.low + 1} – {thresholds.high}</span>
            <span className="text-[10px] text-yellow-700 block font-medium">Explicit intent confirmation</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="text-[10px] text-amber-800 block uppercase font-bold">High (Step-Up)</span>
            <span className="text-2xl font-black text-amber-900 font-mono">{thresholds.high + 1} – {thresholds.critical}</span>
            <span className="text-[10px] text-amber-700 block font-medium">4-Digit PIN challenge</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
            <span className="text-[10px] text-rose-800 block uppercase font-bold">Critical (Step-Up + SOC)</span>
            <span className="text-2xl font-black text-rose-900 font-mono">{thresholds.critical + 1} – 100</span>
            <span className="text-[10px] text-rose-700 block font-medium">PIN + automated incident alert</span>
          </div>
        </div>
      </div>

      {/* Recalibration Snapshots History */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Historical Adaptation Log (ModelPerformanceSnapshots)</h4>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-2.5 pl-3">Timestamp</th>
                <th className="py-2.5">Precision</th>
                <th className="py-2.5">Recall</th>
                <th className="py-2.5">F1 Harmonic</th>
                <th className="py-2.5">High Cutoff</th>
                <th className="py-2.5">Critical Cutoff</th>
                <th className="py-2.5 text-right pr-3">Evaluation Sample</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px] bg-white">
              {snapshots.slice(0, 8).map((snap, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 pl-3 text-slate-500">
                    {new Date(snap.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 text-emerald-700 font-bold">{(snap.precision * 100).toFixed(1)}%</td>
                  <td className="py-2.5 text-blue-700 font-bold">{(snap.recall * 100).toFixed(1)}%</td>
                  <td className="py-2.5 text-slate-900 font-black">{(snap.f1 * 100).toFixed(1)}%</td>
                  <td className="py-2.5 text-amber-700 font-bold">{snap.thresholds?.high || 70}</td>
                  <td className="py-2.5 text-rose-700 font-bold">{snap.thresholds?.critical || 85}</td>
                  <td className="py-2.5 text-right pr-3 text-slate-500">{snap.sampleSize || 200} txns</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
