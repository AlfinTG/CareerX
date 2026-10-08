import type { UserProfile } from './store';

export interface BaselineScores {
  overall: number;
  technicalSkills: number;
  problemSolving: number;
  projectDepth: number;
  productionReadiness: number;
  careerClarity: number;
  communication: number;
}

export interface BaselineSignal {
  label: string;
  type: 'strong' | 'developing' | 'weak';
}

export interface CareerBaseline {
  scores: BaselineScores;
  signals: BaselineSignal[];
  biggestOpportunity: string;
  insight: string;
  productionPotential: number;
}

export function computeBaseline(profile: UserProfile): CareerBaseline {
  const allSkills = [...profile.strongSkills, ...profile.developingSkills, ...profile.learningSkills];
  const strongCount = profile.strongSkills.length;
  const devCount = profile.developingSkills.length;
  const hasDeploy = allSkills.some(s => /docker|aws|gcp|cloud|deploy|fastapi|flask/i.test(s));
  const hasMath   = allSkills.some(s => /math|statistics|linear algebra/i.test(s));
  const hasML     = allSkills.some(s => /pytorch|tensorflow|ml|machine learning|ai/i.test(s));
  const hasData   = allSkills.some(s => /pandas|numpy|sql|data/i.test(s));

  const technical          = Math.min(95, 50 + strongCount * 5 + (hasML ? 10 : 0) + (hasData ? 8 : 0) + (hasMath ? 7 : 0));
  const problemSolving     = Math.min(95, 55 + (hasMath ? 15 : 5) + strongCount * 3);
  const projectDepth       = Math.min(95, 30 + profile.experience.length * 12 + (profile.experience.length > 0 ? 10 : 0));
  const productionReadiness = Math.min(95, 15 + (hasDeploy ? 30 : 0) + devCount * 4);
  const careerClarity      = Math.min(95, 40 + profile.careerGoals.length * 15 + profile.interests.length * 5);
  const communication      = Math.min(95, 55 + (profile.experience.length > 0 ? 15 : 0) + profile.experience.length * 5);
  const overall            = Math.round((technical + problemSolving + projectDepth + productionReadiness + careerClarity + communication) / 6);

  const signals: BaselineSignal[] = [];
  profile.strongSkills.slice(0, 3).forEach(s => signals.push({ label: s, type: 'strong' }));
  if (hasMath) signals.push({ label: 'Mathematical Foundation', type: 'strong' });
  profile.developingSkills.slice(0, 3).forEach(s => signals.push({ label: s, type: 'developing' }));
  if (!hasDeploy) signals.push({ label: 'Production Deployment', type: 'weak' });
  if (!hasML && profile.interests.some(i => /ai|ml/i.test(i))) signals.push({ label: 'ML Frameworks', type: 'weak' });
  signals.push({ label: 'System Design', type: 'weak' });

  const biggestOpportunity = hasDeploy
    ? `Deepen your ${profile.developingSkills[0] || 'SQL'} skills and build production-scale projects.`
    : 'Build and deploy one end-to-end ML or software system.';

  const insight = `You have ${strongCount > 3 ? 'strong' : 'developing'} foundations in ${
    profile.strongSkills.slice(0, 2).join(' and ') || 'programming'
  }. Your profile currently shows a gap between theory and production experience.`;

  return {
    scores: { overall, technicalSkills: technical, problemSolving, projectDepth, productionReadiness, careerClarity, communication },
    signals,
    biggestOpportunity,
    insight,
    productionPotential: Math.min(95, productionReadiness + 26),
  };
}
