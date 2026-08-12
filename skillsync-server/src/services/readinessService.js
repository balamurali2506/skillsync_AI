// src/services/readinessService.js
const WEIGHTS = {
  resume: 0.20,
  interview: 0.20,
  technicalSkills: 0.20,
  coding: 0.15,
  projects: 0.15,
  communication: 0.10,
};

export function calculateReadiness(metrics) {
  let totalWeight = 0;
  let weightedSum = 0;
  const breakdown = {};

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const value = metrics[key];
    breakdown[key] = value; // Keep null if not assessed
    
    if (value !== null && value !== undefined && !isNaN(value)) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }

  // If no data exists yet, overall is 0. Otherwise, normalize to 100.
  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  
  return { overall, breakdown, hasData: totalWeight > 0 };
}

export function getReadinessLabel(score) {
  if (score >= 90) return 'Highly Competitive';
  if (score >= 75) return 'Interview Ready';
  if (score >= 60) return 'Good Progress';
  if (score >= 40) return 'Developing';
  return 'Needs Improvement';
}