const API_BASE = '/api';

export async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('paytelemetry_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export function formatCurrency(val) {
  if (typeof val !== 'number') val = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

// Professional, restrained status & risk tokens
export function getRiskColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return {
        bg: 'bg-rose-50/70',
        border: 'border-rose-200',
        text: 'text-rose-900',
        badge: 'bg-rose-50 text-rose-800 border border-rose-200/80 font-bold',
        dot: 'bg-rose-600',
        bar: 'bg-rose-600',
        label: 'Critical Anomaly'
      };
    case 'high':
      return {
        bg: 'bg-amber-50/70',
        border: 'border-amber-200',
        text: 'text-amber-900',
        badge: 'bg-amber-50 text-amber-900 border border-amber-200/80 font-bold',
        dot: 'bg-amber-600',
        bar: 'bg-amber-600',
        label: 'High Variance'
      };
    case 'medium':
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-900',
        badge: 'bg-slate-100 text-slate-800 border border-slate-200 font-semibold',
        dot: 'bg-slate-600',
        bar: 'bg-slate-600',
        label: 'Medium Risk'
      };
    case 'low':
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-800',
        badge: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
        dot: 'bg-slate-400',
        bar: 'bg-slate-400',
        label: 'Low Risk'
      };
    default:
      return {
        bg: 'bg-white',
        border: 'border-slate-200',
        text: 'text-slate-700',
        badge: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
        dot: 'bg-emerald-600',
        bar: 'bg-slate-900',
        label: 'Normal'
      };
  }
}
