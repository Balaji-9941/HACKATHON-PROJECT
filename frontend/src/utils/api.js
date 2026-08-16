const API_BASE = '/api';

export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('paytelemetry_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const getRiskColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return {
        text: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-800 border border-red-300 font-bold',
        dot: 'bg-red-600'
      };
    case 'high':
      return {
        text: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
        dot: 'bg-rose-600'
      };
    case 'medium':
      return {
        text: 'text-amber-800',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
        dot: 'bg-amber-500'
      };
    case 'low':
      return {
        text: 'text-yellow-800',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-900 border border-yellow-300 font-semibold',
        dot: 'bg-yellow-500'
      };
    case 'none':
    default:
      return {
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold',
        dot: 'bg-emerald-500'
      };
  }
};
