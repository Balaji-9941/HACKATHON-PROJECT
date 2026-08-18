import React, { useState, useEffect } from 'react';
import { HeartPulse, Database, Cpu, Sparkles, Server, RefreshCw } from 'lucide-react';
import { fetchAPI } from '../../utils/api';

export default function SystemHealthPanel() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/health');
      setHealth(data);
    } catch (e) {
      console.warn('[SystemHealthPanel] Health error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const isMongoHealthy = health?.mongodb?.connected;
  const isMLHealthy = health?.mlService?.healthy;
  const isLLMHealthy = health?.aiNarrative?.healthy;
  const dataSource = health?.dataSource || 'offline-sample';

  return (
    <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-card space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HeartPulse className="w-5 h-5 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">System Dependencies & Circuit Health</h3>
        </div>

        <button
          onClick={checkHealth}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
          title="Poll Health Now"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* MongoDB Status */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800">MongoDB Database</span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${isMongoHealthy ? 'bg-slate-900' : 'bg-rose-500'}`} />
          </div>
          <p className="text-[11px] text-slate-600 font-mono">
            State: <strong className="text-slate-900">{isMongoHealthy ? 'CONNECTED' : 'DISCONNECTED'}</strong>
          </p>
        </div>

        {/* Tier 2 ML Microservice */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800">Tier 2 Python ML</span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${isMLHealthy ? 'bg-slate-900' : 'bg-slate-400'}`} />
          </div>
          <p className="text-[11px] text-slate-600 font-mono">
            Circuit: <strong className="text-slate-900">{isMLHealthy ? 'ACTIVE (Online)' : 'OPEN (Tier 1 Fallback)'}</strong>
          </p>
        </div>

        {/* LLM Narrative */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800">LLM Narrative</span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${isLLMHealthy ? 'bg-slate-900' : 'bg-slate-400'}`} />
          </div>
          <p className="text-[11px] text-slate-600 font-mono">
            Provider: <strong className="text-slate-900">{health?.aiNarrative?.provider || 'Template Fallback'}</strong>
          </p>
        </div>

        {/* Data Source Mode */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800">Dataset Source</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
          </div>
          <p className="text-[11px] text-slate-600 font-mono truncate">
            Mode: <strong className="text-slate-900 font-bold">{dataSource}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
