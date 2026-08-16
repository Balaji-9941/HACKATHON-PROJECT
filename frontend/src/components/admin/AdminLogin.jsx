import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin({ onBackToConsumer }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('analyst1');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (user) => {
    setUsername(user);
    setPassword('password123');
    login(user, 'password123').catch(err => setError(err.message));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200/80 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">PayTelemetry SOC Portal</h1>
          <p className="text-xs text-slate-500 font-medium">Enterprise Real-Time Fraud Operations & Triage</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Analyst Identifier</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Verifying credentials...' : 'Sign In to SOC Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Sign-in */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 text-center font-medium">Demo Quick Sign-In:</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'analyst1', role: 'Analyst' },
              { id: 'senior1', role: 'Lead Senior' },
              { id: 'admin1', role: 'SOC Admin' }
            ].map(inv => (
              <button
                key={inv.id}
                onClick={() => quickLogin(inv.id)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center text-xs text-slate-700 hover:text-slate-900 transition font-medium"
              >
                <span className="block font-bold text-[11px] text-slate-900">{inv.id}</span>
                <span className="text-[10px] text-slate-500">{inv.role}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onBackToConsumer}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center space-x-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Consumer Application</span>
          </button>
        </div>
      </div>
    </div>
  );
}
