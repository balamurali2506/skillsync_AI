// Mirrors the score tokens in styles/tokens.css — keep in sync.
export const SCORE = {
  low:  { from: '#fda4af', to: '#e11d48' },
  mid:  { from: '#fcd34d', to: '#f59e0b' },
  high: { from: '#34d399', to: '#a3e635' },
};

export const BRAND_GRADIENT_STOPS = ['#6366f1', '#8b5cf6', '#d946ef'];

// 0–100 → band. Thresholds tuned for ATS/readiness-style scores.
export function scoreBand(value) {
  if (value >= 75) return 'high';
  if (value >= 45) return 'mid';
  return 'low';
}