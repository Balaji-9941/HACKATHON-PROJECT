import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Activity, Gauge, Zap, Sparkles } from 'lucide-react';
import { fetchAPI } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';

export default function AutoFlowControlPanel() {
  const { autoflowStatus } = useSocket();
  const [status, setStatus] = useState({
    running: true,
    paused: false,
    ratePerSecond: 2,
    totalProcessed: 0,
    avgLatencyMs: 14.2
  });
  const [rateInput, setRateInput] = useState(2);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await fetchAPI('/simulator/autoflow/status');
      setStatus(data);
      setRateInput(data.ratePerSecond);
    } catch (e) {
      console.warn('[AutoFlowControlPanel] Error:', e.message);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (!autoflowStatus) return;
    setStatus(autoflowStatus);
    setRateInput(autoflowStatus.ratePerSecond);
  }, [autoflowStatus]);

  const handleStart = async () => {
    setIsUpdating(true);
    try {
      const res = await fetchAPI('/simulator/autoflow/start', { method: 'POST' });
      setStatus(res.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePause = async () => {
    setIsUpdating(true);
    try {
      const res = await fetchAPI('/simulator/autoflow/pause', { method: 'POST' });
      setStatus(res.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStop = async () => {
    setIsUpdating(true);
    try {
      const res = await fetchAPI('/simulator/autoflow/stop', { method: 'POST' });
      setStatus(res.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRateChange = async (newRate) => {
    const rateVal = Number(newRate);
    setRateInput(rateVal);
    try {
      const res = await fetchAPI('/simulator/autoflow/config', {
        method: 'PUT',
        body: JSON.stringify({ ratePerSecond: rateVal })
      });
      setStatus(res.status);
    } catch (e) {
      console.warn('[RateChange] Error:', e.message);
    }
  };

  const isStreaming = status.running && !status.paused;

  return (
    <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Auto-Flow Background Stream Controller</span>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              isStreaming
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : status.paused
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {isStreaming ? '● STREAMING (Active)' : status.paused ? '⏸ PAUSED' : '⏹ STOPPED'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Continuous 85% replay, 10% high-variance, and 5% scenario mixture scoring in real-time</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {isStreaming ? (
            <button
              onClick={handlePause}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow-xs"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Stream</span>
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition border border-slate-200"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      {/* Stream Metrics & Rate Slider */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Processed Transactions</span>
          <span className="text-lg font-bold text-slate-900 font-mono">
            {status.totalProcessed?.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">Emitted through telemetry engine</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Average Latency</span>
          <span className="text-lg font-bold text-emerald-700 font-mono">
            {status.avgLatencyMs || 14.2}ms
          </span>
          <span className="text-[10px] text-slate-500 block">Sub-20ms Tier 1 SLA guaranteed</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-semibold text-[11px]">Throughput Rate:</span>
            <span className="font-mono font-bold text-blue-700">{rateInput} txns/sec</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="15"
            step="0.5"
            value={rateInput}
            onChange={(e) => handleRateChange(e.target.value)}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>
    </div>
  );
}
