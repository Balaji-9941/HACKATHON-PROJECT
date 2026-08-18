import React, { useState } from 'react';
import { Play, Zap, ShieldAlert, Globe, Network, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { fetchAPI } from '../../utils/api';

export default function ScenarioInjectorPanel({ onScenarioTriggered }) {
  const [activeScenario, setActiveScenario] = useState(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const scenarios = [
    {
      id: 'velocity_burst',
      name: 'Velocity Burst Attack',
      icon: Zap,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: 'Score: ~45 (Low/Med)',
      desc: 'Fires 4 rapid succession payments within <30 seconds on Aarav Patel to trigger the Velocity Burst telemetry rule.',
    },
    {
      id: 'device_takeover',
      name: 'Account / Device Takeover',
      icon: ShieldAlert,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      badge: 'Score: ~78 (High)',
      desc: 'Transfers 9.5× typical volume to a quick-loan servicer from an unrecognized hardware emulator.',
    },
    {
      id: 'impossible_travel',
      name: 'Impossible Geo-Travel Jump',
      icon: Globe,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      badge: 'Score: ~74 (High)',
      desc: 'Generates a transaction originating 6,000km away in Moscow, RU at 03:15 AM outside typical operating hours.',
    },
    {
      id: 'mule_ring',
      name: 'Mule Ring Money Funnel',
      icon: Network,
      color: 'text-red-600 bg-red-50 border-red-200',
      badge: 'Score: ~92 (Critical)',
      desc: 'Funnel transfer through high-risk mule cluster into CryptoExchange P2P Desk with Tier 5 risk profile.',
    },
    {
      id: 'card_testing',
      name: 'Automated Bot Probing',
      icon: CreditCard,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: 'Score: ~28 (Probing)',
      desc: 'Fires micro-transaction probing gateway authorizations with scripted automated device signature.',
    },
  ];

  const handleTrigger = async (scenario) => {
    try {
      setIsTriggering(true);
      setActiveScenario(scenario.id);
      setFeedback(null);

      const res = await fetchAPI('/simulator/trigger', {
        method: 'POST',
        body: JSON.stringify({ scenarioType: scenario.id }),
      });

      setFeedback({
        scenarioName: scenario.name,
        txnId: res.transaction?.transactionId,
        score: res.transaction?.totalRiskScore,
        severity: res.transaction?.alertSeverity,
        explanation: res.transaction?.fraudExplanation,
      });

      if (onScenarioTriggered) onScenarioTriggered(res.transaction);
    } catch (e) {
      alert(`Scenario trigger error: ${e.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Live Scenario Injector Panel</span>
        </h3>
        <p className="text-xs text-slate-500 font-medium">Fire deterministic fraud patterns against real customer baselines in &lt;10s</p>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start space-x-3 text-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold text-slate-950">
              Successfully Injected: <span className="text-blue-700">{feedback.scenarioName}</span> ({feedback.txnId})
            </p>
            <p className="text-slate-700">
              Evaluated Score: <strong className="font-mono text-blue-800">{feedback.score}/100</strong> • Severity: <strong className="uppercase font-mono">{feedback.severity}</strong>
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">{feedback.explanation}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {scenarios.map((scen) => {
          const Icon = scen.icon;
          const isCurrent = activeScenario === scen.id && isTriggering;
          return (
            <div
              key={scen.id}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:shadow-card-hover transition space-y-3 flex flex-col justify-between shadow-card"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${scen.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                    {scen.badge}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{scen.name}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{scen.desc}</p>
                </div>
              </div>

              <button
                onClick={() => handleTrigger(scen)}
                disabled={isTriggering}
                className="w-full py-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-800 hover:text-blue-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition active:scale-98 shadow-xs"
              >
                <Play className={`w-3 h-3 fill-current text-blue-600 ${isCurrent ? 'animate-spin' : ''}`} />
                <span>{isCurrent ? 'Scoring Telemetry...' : 'Inject Pattern'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
