// CareerX client-side store — localStorage-backed prototype persistence.

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  year: 1 | 2 | 3 | 4;
  degree: string;
  institution: string;
  strongSkills: string[];
  developingSkills: string[];
  learningSkills: string[];
  interests: string[];
  experience: string[];
  careerGoals: string[];
  onboardingComplete: boolean;
  analysisComplete: boolean;
  completedTasks: string[];
  completedModules: string[];
  completedProjects: string[];
  resumeOptimized: boolean;
  resumeText: string;
  resumeScore: number;
  interviewScore: number | null;
  readiness: number;
  simulationResultJson: string | null;
  selectedPathTitle: string | null;
}

export const DEFAULT_PROFILE: UserProfile = {
  id: '', name: '', email: '', year: 1, degree: '', institution: '',
  strongSkills: [], developingSkills: [], learningSkills: [], interests: [],
  experience: [], careerGoals: [], onboardingComplete: false, analysisComplete: false,
  completedTasks: [], completedModules: [], completedProjects: [],
  resumeOptimized: false, resumeText: '', resumeScore: 0, interviewScore: null,
  readiness: 0, simulationResultJson: null, selectedPathTitle: null,
};

export const DEMO_PROFILE: UserProfile = {
  id: 'demo-001',
  name: 'Alex Chen',
  email: 'alex@university.edu',
  year: 2,
  degree: 'Computer Science',
  institution: 'University of Technology',
  strongSkills: ['Python', 'Mathematics', 'NumPy', 'Pandas', 'Git', 'Problem Solving'],
  developingSkills: ['PyTorch', 'SQL', 'Docker'],
  learningSkills: ['MLOps', 'FastAPI', 'System Design'],
  interests: ['AI / ML', 'Computer Vision', 'Research', 'Startups'],
  experience: ['2 Hackathons (Winner)', 'Data Analysis Intern', 'Open Source Contributor'],
  careerGoals: ['AI/ML Engineer', 'Research Scientist'],
  onboardingComplete: true,
  analysisComplete: true,
  completedTasks: [],
  completedModules: [],
  completedProjects: [],
  resumeOptimized: false,
  resumeText: 'Alex Chen\nYear 2 Computer Science Student\n\nSkills: Python, NumPy, Pandas, Mathematics\n\nProjects:\n- Built a machine learning project using Python.\n- Familiar with data analysis and visualization.',
  resumeScore: 78,
  interviewScore: null,
  readiness: 76,
  simulationResultJson: null,
  selectedPathTitle: null,
};

const STORE_KEY = 'careerx_user';
const SESSION_KEY = 'careerx_session';

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORE_KEY, JSON.stringify(profile));
}

export function loadProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as UserProfile; } catch { return null; }
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(SESSION_KEY);
}

export function setLoggedIn(name: string, email: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email, at: Date.now() }));
}

export function getSession(): { name: string; email: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
