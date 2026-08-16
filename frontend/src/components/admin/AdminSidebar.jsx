import React from 'react';
import {
  Activity,
  ShieldAlert,
  Kanban,
  Cpu,
  ScatterChart as ScatterIcon,
  Network,
  Sliders,
  Sparkles,
  HeartPulse,
  LogOut,
  Smartphone,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar({ activeTab, onTabChange, onSwitchToConsumer }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'stream', label: 'Live Stream & Telemetry', icon: Activity },
    { id: 'alerts', label: 'Alert Triage Queue', icon: ShieldAlert },
    { id: 'kanban', label: 'Investigation Board', icon: Kanban },
    { id: 'performance', label: 'ML Benchmark & SHAP', icon: Cpu },
    { id: 'scatter', label: 'Anomaly Scatter Space', icon: ScatterIcon },
    { id: 'graph', label: 'Fraud Network Graph', icon: Network },
    { id: 'thresholds', label: 'Adaptive Thresholding', icon: Sliders },
    { id: 'scenarios', label: 'Scenario Injector & Stream', icon: Sparkles },
    { id: 'health', label: 'System Reliability Health', icon: HeartPulse }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 h-screen sticky top-0 shadow-sm z-30">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-2 pt-1">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">PayTelemetry</h1>
            <p className="text-[10px] text-slate-500 font-medium">Fraud Operations SOC</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Analyst Session & Mode Switch */}
      <div className="space-y-2 pt-4 border-t border-slate-100">
        <button
          onClick={onSwitchToConsumer}
          className="w-full flex items-center justify-center space-x-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
        >
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>Switch to Consumer App</span>
        </button>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.name || user?.username}</p>
            <p className="text-[10px] text-slate-500 font-medium capitalize">{user?.role || 'analyst'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
