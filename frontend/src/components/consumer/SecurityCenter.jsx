import React, { useState } from 'react';
import { Smartphone, ShieldCheck } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export default function SecurityCenter() {
  const { activeCustomer } = useCustomer();
  const [devices, setDevices] = useState(activeCustomer?.knownDevices || ['Pixel-8-Pro', 'MacBook-Pro']);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  if (!activeCustomer) return null;

  const score = activeCustomer.securityScore || 92;

  const handleRevokeDevice = (device) => {
    setDevices((prev) => prev.filter((d) => d !== device));
  };

  return (
    <div className="space-y-4 animate-fade-in text-slate-900">
      <h3 className="text-base font-bold text-slate-900">Security Center</h3>

      {/* Security Score Gauge Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-card">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-22 h-22 rounded-full border-4 border-emerald-500 bg-emerald-50/50 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-black text-slate-900 font-mono">{score}</span>
              <span className="text-[10px] text-slate-500 font-semibold block -mt-1">/100</span>
            </div>
          </div>
        </div>

        <div>
          <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
            Account Telemetry Baseline Active
          </span>
          <p className="text-xs text-slate-600 mt-2 max-w-xs mx-auto font-medium">
            Your UPI account telemetry is verified with registered hardware keys and established behavior baselines.
          </p>
        </div>
      </div>

      {/* Active Known Devices */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Authorized Devices</h4>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">{devices.length} active</span>
        </div>

        <div className="space-y-2">
          {devices.map((device, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800">{device}</span>
                {idx === 0 && <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded text-slate-700 font-medium">Current</span>}
              </div>
              {idx > 0 && (
                <button
                  onClick={() => handleRevokeDevice(device)}
                  className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Baseline Behavior Profile */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-2.5 text-xs">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Learned Account Baselines</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Avg. Transaction</span>
            <span className="font-bold text-slate-900 text-sm font-mono">₹{activeCustomer.avgTransaction || 500}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Active Hours</span>
            <span className="font-bold text-slate-900 text-sm font-mono">{activeCustomer.typicalHours || '08:00-23:00'}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 col-span-2">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Home Location</span>
            <span className="font-bold text-slate-900 text-sm">{activeCustomer.usualLocation || 'Bangalore, IN'}</span>
          </div>
        </div>
      </div>

      {/* Security Preferences */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-card space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Security Preferences</h4>
        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-slate-800">Biometric Prompt for Anomaly</p>
            <p className="text-[11px] text-slate-500">Ask for Fingerprint/FaceID on elevated variance</p>
          </div>
          <button
            onClick={() => setBiometricEnabled(!biometricEnabled)}
            className={`w-11 h-6 rounded-full transition-colors p-0.5 ${biometricEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${biometricEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
