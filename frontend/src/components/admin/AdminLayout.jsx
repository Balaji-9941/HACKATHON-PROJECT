import React, { useState, useEffect } from 'react';
import { Shield, Activity } from 'lucide-react';
import { fetchAPI } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import AdminSidebar from './AdminSidebar';
import MetricsStrip from './MetricsStrip';
import LiveStreamTable from './LiveStreamTable';
import TelemetryDrawer from './TelemetryDrawer';
import AlertQueue from './AlertQueue';
import AlertDetail from './AlertDetail';
import InvestigationBoard from './InvestigationBoard';
import ModelPerformance from './ModelPerformance';
import AnomalyScatter from './AnomalyScatter';
import FraudNetworkGraph from './FraudNetworkGraph';
import AdaptiveThresholdPanel from './AdaptiveThresholdPanel';
import ScenarioInjectorPanel from './ScenarioInjectorPanel';
import AutoFlowControlPanel from './AutoFlowControlPanel';
import SystemHealthPanel from './SystemHealthPanel';

export default function AdminLayout({ onSwitchToConsumer }) {
  const { isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState('stream');
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [graphTargetCustomerId, setGraphTargetCustomerId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadData = async () => {
    try {
      const [m, h] = await Promise.all([
        fetchAPI('/admin/metrics'),
        fetchAPI('/health')
      ]);
      setMetrics(m);
      setHealth(h);
    } catch (e) {
      console.warn('[AdminLayout] Load error:', e.message);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleInspectNetwork = (customerId) => {
    setGraphTargetCustomerId(customerId);
    setActiveTab('graph');
    setSelectedTransaction(null);
    setSelectedAlert(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Left Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedAlert(null);
        }}
        onSwitchToConsumer={onSwitchToConsumer}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {activeTab === 'stream' ? 'Real-Time Monitoring & Telemetry' :
               activeTab === 'alerts' ? 'Security Incident Triage' :
               activeTab === 'kanban' ? 'Fraud Operations Workflow' :
               activeTab === 'performance' ? 'ML Validation & Benchmarks' :
               activeTab === 'scatter' ? 'Multivariate Risk Distribution' :
               activeTab === 'graph' ? 'Network Topology & Mule Graph' :
               activeTab === 'thresholds' ? 'Adaptive Severity Calibration' :
               activeTab === 'scenarios' ? 'Scenario Injection & Auto-Flow' : 'System Health Monitor'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Socket Status */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-slate-900' : 'bg-rose-500'}`} />
              <span className="text-slate-700 font-semibold">{isConnected ? 'FEED CONNECTED' : 'DISCONNECTED'}</span>
            </div>

            {/* Live Time */}
            <span className="text-xs font-mono text-slate-500 font-medium hidden sm:inline-block">
              {currentTime} IST
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main className="p-6 space-y-6 flex-1">
          {/* Top Metrics Strip */}
          <MetricsStrip metrics={metrics} health={health} />

          {/* Tab Views */}
          {activeTab === 'stream' && (
            <div className="space-y-6">
              <LiveStreamTable onSelectTransaction={(txn) => setSelectedTransaction(txn)} />
              <AutoFlowControlPanel />
              <ScenarioInjectorPanel onScenarioTriggered={() => loadData()} />
            </div>
          )}

          {activeTab === 'alerts' && (
            selectedAlert ? (
              <AlertDetail
                alertData={selectedAlert}
                onBack={() => setSelectedAlert(null)}
                onInspectNetwork={handleInspectNetwork}
                onInspectTransaction={(txn) => setSelectedTransaction(txn)}
              />
            ) : (
              <AlertQueue onSelectAlert={(a) => setSelectedAlert(a)} />
            )
          )}

          {activeTab === 'kanban' && (
            <InvestigationBoard onSelectAlert={(a) => setSelectedAlert(a)} />
          )}

          {activeTab === 'performance' && (
            <ModelPerformance />
          )}

          {activeTab === 'scatter' && (
            <AnomalyScatter onSelectTransaction={(txn) => setSelectedTransaction(txn)} />
          )}

          {activeTab === 'graph' && (
            <FraudNetworkGraph
              targetCustomerId={graphTargetCustomerId}
              onSelectCustomer={(cust) => setGraphTargetCustomerId(cust)}
            />
          )}

          {activeTab === 'thresholds' && (
            <AdaptiveThresholdPanel />
          )}

          {activeTab === 'scenarios' && (
            <div className="space-y-6">
              <ScenarioInjectorPanel onScenarioTriggered={() => loadData()} />
              <AutoFlowControlPanel />
            </div>
          )}

          {activeTab === 'health' && (
            <SystemHealthPanel />
          )}
        </main>
      </div>

      {/* Telemetry Slide-over Drawer */}
      {selectedTransaction && (
        <TelemetryDrawer
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onInspectNetwork={handleInspectNetwork}
        />
      )}
    </div>
  );
}
