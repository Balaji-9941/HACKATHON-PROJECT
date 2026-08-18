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

// Professional, distinct fintech color tokens for clear risk differentiation
export function getRiskColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        badge: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold',
        dot: 'bg-rose-600',
        bar: 'bg-rose-600',
        chart: '#e11d48',
        label: 'Critical Anomaly'
      };
    case 'high':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badge: 'bg-amber-50 text-amber-700 border border-amber-200 font-bold',
        dot: 'bg-amber-500',
        bar: 'bg-amber-500',
        chart: '#f59e0b',
        label: 'High Variance'
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        badge: 'bg-yellow-50 text-yellow-800 border border-yellow-200 font-semibold',
        dot: 'bg-yellow-500',
        bar: 'bg-yellow-500',
        chart: '#eab308',
        label: 'Medium Risk'
      };
    case 'low':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium',
        dot: 'bg-blue-500',
        bar: 'bg-blue-500',
        chart: '#3b82f6',
        label: 'Low Risk'
      };
    default:
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
        dot: 'bg-emerald-500',
        bar: 'bg-emerald-500',
        chart: '#10b981',
        label: 'Normal'
      };
  }
}
