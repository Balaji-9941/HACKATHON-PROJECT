import React from 'react';
import {
  Activity,
  ShieldAlert,
  Kanban,
  Cpu,
  ScatterChart,
  Network,
  Sliders,
  Play,
  HeartPulse,
  LogOut,
  Smartphone,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar({ activeTab, onTabChange, onSwitchToConsumer }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'stream', label: 'Live Telemetry Stream', icon: Activity },
    { id: 'alerts', label: 'Incident Triage Queue', icon: ShieldAlert },
    { id: 'kanban', label: 'Investigation Board', icon: Kanban },
    { id: 'graph', label: 'Entity Network Graph', icon: Network },
    { id: 'performance', label: 'Model Validation Metrics', icon: Cpu },
    { id: 'scatter', label: 'Multivariate Risk Space', icon: ScatterChart },
    { id: 'thresholds', label: 'Adaptive Threshold Tuning', icon: Sliders },
    { id: 'scenarios', label: 'Scenario Injector & Stream', icon: Play },
    { id: 'health', label: 'System Dependencies', icon: HeartPulse },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">PayTelemetry</h1>
              <p className="text-[10px] text-blue-700 font-mono mt-1 font-semibold uppercase tracking-wider">Enterprise SOC</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-xs'
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

      {/* Footer Profile & Switcher */}
      <div className="p-3 border-t border-slate-200 space-y-2">
        {/* Switch to Consumer App */}
        <button
          onClick={onSwitchToConsumer}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 text-xs font-semibold transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Consumer UPI Demo</span>
        </button>

        {/* User Card */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName || 'Senior SOC Analyst'}</p>
            <p className="text-[10px] font-mono text-slate-500 truncate">{user?.role || 'L2 Lead'} • {user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
