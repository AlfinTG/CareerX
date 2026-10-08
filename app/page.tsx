"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SimulationResult, CareerPath } from "@/lib/schema";
import {
  UserProfile, DEMO_PROFILE, DEFAULT_PROFILE,
  saveProfile, loadProfile, clearProfile,
  isLoggedIn, setLoggedIn, getSession,
} from "@/lib/store";
import { computeBaseline, CareerBaseline } from "@/lib/baseline";
import {
  Logo, NavBar, PrimaryBtn, GhostBtn, SectionLabel,
  RadialGauge, SkillBar, StepIndicator, TagInput,
  InsightCard, Modal, EmptyState, Spinner, ActionCard,
} from "@/components/ui";

type AppState =
  | "landing" | "auth" | "onboarding" | "loading"
  | "analysis" | "baseline" | "results" | "detail"
  | "learning" | "project" | "resume" | "interview";

/* ═══════════════════════════════════════════════════════════════
   ROOT ORCHESTRATOR
═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [state, setState] = useState<AppState>("landing");
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [baseline, setBaseline] = useState<CareerBaseline | null>(null);
  const [activeLearningTopic, setActiveLearningTopic] = useState<string>("PyTorch");
  const [activeProject, setActiveProject] = useState<CareerPath["projects"][number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    if (isLoggedIn()) {
      const saved = loadProfile();
      if (saved) {
        setProfileState(saved);
        const bl = computeBaseline(saved);
        setBaseline(bl);
        if (saved.simulationResultJson) {
          try {
            const r = JSON.parse(saved.simulationResultJson) as SimulationResult;
            setResult(r);
            if (saved.selectedPathTitle) {
              const p = r.paths.find(x => x.title === saved.selectedPathTitle);
              if (p) setSelectedPath(p);
            }
          } catch { /* ignore */ }
        }
        setState(saved.onboardingComplete && saved.analysisComplete ? "results" : "onboarding");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistProfile = useCallback((updated: UserProfile) => {
    setProfileState(updated);
    saveProfile(updated);
  }, []);

  const handleLogin = (name: string, email: string, isNew: boolean) => {
    setLoggedIn(name, email);
    const existing = loadProfile();
    if (existing && existing.email === email) {
      setProfileState(existing);
      const bl = computeBaseline(existing);
      setBaseline(bl);
      if (existing.simulationResultJson) {
        try {
          const r = JSON.parse(existing.simulationResultJson) as SimulationResult;
          setResult(r);
        } catch { /* ignore */ }
      }
      setState(existing.onboardingComplete && existing.analysisComplete ? "results" : "onboarding");
    } else {
      const fresh: UserProfile = { ...DEFAULT_PROFILE, name, email, id: Date.now().toString() };
      persistProfile(fresh);
      setState(isNew ? "onboarding" : "onboarding");
    }
  };

  const handleLogout = () => {
    clearProfile();
    setProfileState(DEFAULT_PROFILE);
    setResult(null);
    setSelectedPath(null);
    setBaseline(null);
    setState("landing");
  };

  const handleLoadDemo = () => {
    setLoggedIn(DEMO_PROFILE.name, DEMO_PROFILE.email);
    persistProfile(DEMO_PROFILE);
    setResult(null);
    setState("loading");
    runSimulation(DEMO_PROFILE);
  };

  const handleOnboardingComplete = (updated: UserProfile) => {
    const complete = { ...updated, onboardingComplete: true };
    persistProfile(complete);
    setState("loading");
    runSimulation(complete);
  };

  const runSimulation = async (p: UserProfile) => {
    setError(null);
    try {
      const skills = [...p.strongSkills, ...p.developingSkills];
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: p.year || 2, skills: skills.length ? skills : ["Python"], interests: p.interests.length ? p.interests : ["AI / ML"] }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message ?? "Simulation failed."); setState("onboarding"); return; }
      const sim: SimulationResult = data;
      setResult(sim);
      const bl = computeBaseline(p);
      setBaseline(bl);
      const updated = { ...p, simulationResultJson: JSON.stringify(sim), analysisComplete: true, readiness: bl.scores.overall };
      persistProfile(updated);
      setState("analysis");
    } catch {
      setError("Network error. Please try again.");
      setState("onboarding");
    }
  };

  const nav = (s: string) => setState(s as AppState);
  const session = getSession();
  const showCopilot = selectedPath && ["results", "detail", "learning", "project", "resume", "interview"].includes(state);

  return (
    <>
      <div className="bg-ambient" aria-hidden="true" />
      <div className="relative z-10 min-h-screen flex flex-col">
        {state === "landing"   && <LandingPage onStart={() => setState("auth")} onDemo={handleLoadDemo} />}
        {state === "auth"      && <AuthPage onLogin={handleLogin} onBack={() => setState("landing")} />}
        {state === "onboarding" && (
          <OnboardingPage profile={profile} onComplete={handleOnboardingComplete} onDemo={handleLoadDemo} error={error} onClearError={() => setError(null)} />
        )}
        {state === "loading"   && <LoadingPage />}
        {state === "analysis"  && result && baseline && (
          <ProfileAnalysisPage profile={profile} baseline={baseline} result={result} onContinue={() => setState("baseline")} />
        )}
        {state === "baseline"  && baseline && (
          <BaselineDashboardPage baseline={baseline} profile={profile} onContinue={() => setState("results")} onBack={() => setState("analysis")} />
        )}
        {state === "results"   && result && (
          <ResultsPage result={result} profile={profile}
            onSelectPath={(p: CareerPath) => { setSelectedPath(p); persistProfile({ ...profile, selectedPathTitle: p.title }); setState("detail"); }}
            onRerun={() => setState("onboarding")}
            session={session} onLogout={handleLogout}
          />
        )}
        {state === "detail" && selectedPath && result && (
          <DetailPage path={selectedPath} profile={profile} persistProfile={persistProfile}
            onBack={() => setState("results")}
            onOpenLearning={(topic: string) => { setActiveLearningTopic(topic); setState("learning"); }}
            onOpenProject={(proj: CareerPath["projects"][number]) => { setActiveProject(proj); setState("project"); }}
            onOpenResume={() => setState("resume")}
            onOpenInterview={() => setState("interview")}
          />
        )}
        {state === "learning" && selectedPath && (
          <LearningTrackPage topic={activeLearningTopic} path={selectedPath} profile={profile}
            persistProfile={persistProfile} onBack={() => setState("detail")} />
        )}
        {state === "project" && activeProject && selectedPath && (
          <ProjectDetailPage project={activeProject} path={selectedPath} profile={profile}
            persistProfile={persistProfile} onBack={() => setState("detail")} />
        )}
        {state === "resume" && selectedPath && (
          <ResumeStudioPage path={selectedPath} profile={profile} persistProfile={persistProfile} onBack={() => setState("detail")} />
        )}
        {state === "interview" && selectedPath && (
          <VoiceInterviewPage path={selectedPath} profile={profile} persistProfile={persistProfile} onBack={() => setState("detail")} />
        )}

        {showCopilot && selectedPath && (
          <CopilotWidget path={selectedPath} profile={profile} currentPage={state} navigate={nav} />
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
function LandingPage({ onStart, onDemo }: { onStart: () => void; onDemo: () => void }) {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="flex items-center justify-between px-6 lg:px-16 h-20">
        <Logo />
        <div className="flex items-center gap-4">
          <button onClick={onStart} className="text-[#474551] font-medium hover:text-[#13075B] transition-colors text-sm hidden sm:block">Sign In</button>
          <PrimaryBtn onClick={onStart} size="sm">Get Started</PrimaryBtn>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-16 max-w-[1400px] mx-auto w-full relative">
        {/* Trajectory SVG illustration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="traj-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#13075B" stopOpacity="0" />
                <stop offset="50%" stopColor="#2F05EA" stopOpacity="1" />
                <stop offset="100%" stopColor="#13075B" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="350" r="14" fill="#2F05EA" opacity="0.9" className="glow-pulse" />
            <path d="M 214 350 C 450 350, 600 130, 970 110" fill="none" stroke="url(#traj-grad)" strokeWidth="2.5" strokeDasharray="10 5" className="svg-trajectory-line" />
            <circle cx="970" cy="110" r="9" fill="#13075B" opacity="0.8" />
            <path d="M 214 350 L 970 350" fill="none" stroke="url(#traj-grad)" strokeWidth="2.5" strokeDasharray="10 5" className="svg-trajectory-line delay-300" />
            <circle cx="970" cy="350" r="9" fill="#13075B" opacity="0.8" />
            <path d="M 214 350 C 450 350, 600 570, 970 590" fill="none" stroke="url(#traj-grad)" strokeWidth="2.5" strokeDasharray="10 5" className="svg-trajectory-line delay-600" />
            <circle cx="970" cy="590" r="9" fill="#13075B" opacity="0.8" />
            {[380, 550, 720].map((x, i) => <circle key={i} cx={x} cy={350} r="5" fill="#2F05EA" opacity="0.25" />)}
          </svg>
        </div>

        <div className="animate-fade-up relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EFECFC] border border-[#2F05EA]/20 rounded-full text-[#2F05EA] text-xs font-bold tracking-widest uppercase mb-8">
            Career Intelligence Platform
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] font-black tracking-tighter leading-[1.02] mb-8 text-[#1B1B26]">
            Three Futures.<br />
            <span className="text-[#2F05EA]">One You.</span>
          </h1>
          <p className="animate-fade-up delay-100 max-w-2xl text-xl text-[#474551] mb-14 leading-relaxed mx-auto">
            Tell us where you are today. CareerX reveals realistic career trajectories
            and the exact steps that take you from student to professional.
          </p>
          <div className="animate-fade-up delay-200 flex flex-wrap gap-4 justify-center">
            <PrimaryBtn onClick={onStart} size="lg">Explore My Futures →</PrimaryBtn>
            <button onClick={onDemo}
              className="px-10 py-5 rounded-xl border border-[#787682]/30 bg-white/80 text-[#1B1B26] font-bold hover:bg-[#EFECFC] hover:border-[#13075B]/30 transition-all text-lg">
              Try Demo Persona
            </button>
          </div>
        </div>

        <div className="animate-fade-up delay-500 mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {[
            { num: "01", title: "Know Your Baseline", desc: "CareerX analyzes your skills, experience, and goals to establish your career readiness score across six dimensions." },
            { num: "02", title: "See Your Trajectories", desc: "Discover three realistic career paths aligned with your profile. Each shows fit score, skill gaps, and a learning roadmap." },
            { num: "03", title: "Close the Gaps", desc: "Follow a personalized learning path, build portfolio projects, and optimize your resume — all in one place." },
          ].map(item => (
            <div key={item.num} className="glass p-8 rounded-[2rem] text-left card-hover">
              <div className="text-5xl font-black text-[#EFECFC] mb-4">{item.num}</div>
              <h3 className="text-xl font-bold text-[#1B1B26] mb-3">{item.title}</h3>
              <p className="text-[#474551] text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════════════════════════ */
function AuthPage({ onLogin, onBack }: { onLogin: (name: string, email: string, isNew: boolean) => void; onBack: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setErr("Please enter a valid email."); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (mode === "signup" && !name.trim()) { setErr("Please enter your name."); return; }
    const displayName = mode === "signup" ? name.trim() : email.split("@")[0];
    onLogin(displayName, email.toLowerCase().trim(), mode === "signup");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar right={<GhostBtn onClick={onBack}>← Back</GhostBtn>} />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="glass p-10 lg:p-16 rounded-[2rem] w-full max-w-md">
          <div className="text-center mb-10">
            <Logo size="lg" />
            <h2 className="text-2xl font-bold text-[#1B1B26] mt-6">
              {mode === "signin" ? "Welcome back." : "Create your account."}
            </h2>
            <p className="text-sm text-[#787682] mt-2">
              {mode === "signin" ? "Sign in to continue your CareerX journey." : "Build your career intelligence profile."}
            </p>
          </div>

          {err && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">⚠ {err}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-[#787682] uppercase tracking-widest mb-2">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                  className="w-full px-4 py-4 rounded-xl border border-[#787682]/30 bg-white focus:border-[#2F05EA] focus:ring-4 focus:ring-[#2F05EA]/10 outline-none transition-all" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-[#787682] uppercase tracking-widest mb-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu"
                className="w-full px-4 py-4 rounded-xl border border-[#787682]/30 bg-white focus:border-[#2F05EA] focus:ring-4 focus:ring-[#2F05EA]/10 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#787682] uppercase tracking-widest mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-4 py-4 rounded-xl border border-[#787682]/30 bg-white focus:border-[#2F05EA] focus:ring-4 focus:ring-[#2F05EA]/10 outline-none transition-all" />
            </div>
            <PrimaryBtn type="submit" className="w-full py-4 mt-2">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </PrimaryBtn>
          </form>

          <p className="mt-8 text-center text-sm text-[#787682]">
            {mode === "signin"
              ? <>{`Don't have an account? `}<button onClick={() => setMode("signup")} className="text-[#2F05EA] font-bold hover:underline">Create one</button></>
              : <>{`Already have an account? `}<button onClick={() => setMode("signin")} className="text-[#2F05EA] font-bold hover:underline">Sign in</button></>
            }
          </p>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MULTI-STEP ONBOARDING
═══════════════════════════════════════════════════════════════ */
const STEPS = ["Academic", "Skills", "Interests", "Experience", "Goals", "Review"];
const PRESET_INTERESTS = ["AI / ML", "Software Engineering", "Data Science", "Cybersecurity", "Product", "Startups", "Research", "Cloud", "Computer Vision", "Robotics", "Web Development", "DevOps"];
const PRESET_GOALS = ["AI/ML Engineer", "Data Scientist", "Software Engineer", "Research Scientist", "Product Manager", "Backend Engineer", "Not sure yet"];

function OnboardingPage({ profile, onComplete, onDemo, error, onClearError }: {
  profile: UserProfile; onComplete: (p: UserProfile) => void;
  onDemo: () => void; error: string | null; onClearError: () => void;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<UserProfile>({ ...profile });

  const update = (patch: Partial<UserProfile>) => setData(prev => ({ ...prev, ...patch }));
  const canNext = () => {
    if (step === 0) return data.year >= 1;
    if (step === 1) return data.strongSkills.length > 0;
    if (step === 2) return data.interests.length > 0;
    return true;
  };
  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1); else onComplete(data); };
  const back = () => { if (step > 0) setStep(s => s - 1); };

  const toggleInterest = (interest: string) => {
    const next = data.interests.includes(interest)
      ? data.interests.filter(i => i !== interest)
      : [...data.interests, interest];
    update({ interests: next });
  };

  const toggleGoal = (goal: string) => {
    const next = data.careerGoals.includes(goal)
      ? data.careerGoals.filter(g => g !== goal)
      : [...data.careerGoals, goal];
    update({ careerGoals: next });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar right={
        <button onClick={onDemo} className="text-xs font-bold text-[#2F05EA] bg-[#EFECFC] border border-[#2F05EA]/20 rounded-lg px-4 py-2 hover:bg-[#E0DAF9] transition-colors">
          Load Demo ✦
        </button>
      } />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <SectionLabel>Profile Setup</SectionLabel>
            <h2 className="text-4xl font-black text-[#1B1B26] mb-6">Build Your Profile</h2>
            <StepIndicator steps={STEPS} current={step} />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex justify-between items-center">
              <span className="text-sm">⚠ {error}</span>
              <button onClick={onClearError} className="text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          <div className="glass p-8 lg:p-12 rounded-[2rem]">
            {step === 0 && (
              <div className="animate-fade-up flex flex-col gap-8">
                <h3 className="text-2xl font-bold text-[#1B1B26]">Academic Profile</h3>
                <div>
                  <label className="block text-sm font-bold text-[#13075B] uppercase tracking-widest mb-4">Year of Study</label>
                  <div className="grid grid-cols-4 gap-3">
                    {([1, 2, 3, 4] as const).map(y => (
                      <button key={y} type="button" onClick={() => update({ year: y })}
                        className={`py-4 rounded-xl font-bold transition-all ${data.year === y
                          ? "border-2 border-[#13075B] bg-[#EFECFC] text-[#13075B]"
                          : "border border-[#787682]/20 bg-white text-[#474551] hover:bg-[#FCF8FF]"}`}>
                        Year {y}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#13075B] uppercase tracking-widest mb-2">Degree / Field</label>
                    <input value={data.degree} onChange={e => update({ degree: e.target.value })} placeholder="e.g. Computer Science"
                      className="w-full px-4 py-3 rounded-xl border border-[#787682]/30 bg-white focus:border-[#2F05EA] focus:ring-4 focus:ring-[#2F05EA]/10 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#13075B] uppercase tracking-widest mb-2">Institution</label>
                    <input value={data.institution} onChange={e => update({ institution: e.target.value })} placeholder="Optional"
                      className="w-full px-4 py-3 rounded-xl border border-[#787682]/30 bg-white focus:border-[#2F05EA] focus:ring-4 focus:ring-[#2F05EA]/10 outline-none" />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="animate-fade-up flex flex-col gap-8">
                <h3 className="text-2xl font-bold text-[#1B1B26]">Technical Skills</h3>
                <TagInput label="Strong Skills" tags={data.strongSkills} setTags={v => update({ strongSkills: v })}
                  placeholder="e.g. Python, React — press Enter" helper="Skills you use confidently" />
                <TagInput label="Developing Skills" tags={data.developingSkills} setTags={v => update({ developingSkills: v })}
                  placeholder="e.g. PyTorch, SQL" helper="Skills you are actively learning" />
                <TagInput label="Learning / Exploring" tags={data.learningSkills} setTags={v => update({ learningSkills: v })}
                  placeholder="e.g. MLOps, Kubernetes" helper="Skills you have just started" />
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-up flex flex-col gap-8">
                <h3 className="text-2xl font-bold text-[#1B1B26]">Career Interests</h3>
                <div>
                  <label className="block text-sm font-bold text-[#13075B] uppercase tracking-widest mb-4">Select areas that excite you</label>
                  <div className="flex flex-wrap gap-3">
                    {PRESET_INTERESTS.map(interest => (
                      <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                          data.interests.includes(interest)
                            ? "bg-[#13075B] text-white border-[#13075B]"
                            : "bg-white text-[#474551] border-[#787682]/20 hover:border-[#2F05EA]/40"
                        }`}>{interest}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-up flex flex-col gap-8">
                <h3 className="text-2xl font-bold text-[#1B1B26]">Projects & Experience</h3>
                <TagInput label="Experience" tags={data.experience} setTags={v => update({ experience: v })}
                  placeholder="e.g. ML Hackathon, Research Intern, Open Source"
                  helper="Internships, hackathons, projects, open source, research, or clubs" />
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-up flex flex-col gap-8">
                <h3 className="text-2xl font-bold text-[#1B1B26]">Career Goals</h3>
                <div>
                  <label className="block text-sm font-bold text-[#13075B] uppercase tracking-widest mb-4">Roles that interest you</label>
                  <div className="flex flex-wrap gap-3">
                    {PRESET_GOALS.map(goal => (
                      <button key={goal} type="button" onClick={() => toggleGoal(goal)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                          data.careerGoals.includes(goal)
                            ? "bg-[#13075B] text-white border-[#13075B]"
                            : "bg-white text-[#474551] border-[#787682]/20 hover:border-[#2F05EA]/40"
                        }`}>{goal}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="animate-fade-up">
                <h3 className="text-2xl font-bold text-[#1B1B26] mb-8">Profile Review</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {[
                    ["Year", `Year ${data.year}`],
                    ["Degree", data.degree || "Not specified"],
                    ["Strong Skills", data.strongSkills.slice(0, 4).join(", ") || "None yet"],
                    ["Interests", data.interests.slice(0, 3).join(", ") || "None yet"],
                    ["Experience", `${data.experience.length} item(s)`],
                    ["Goals", data.careerGoals.join(", ") || "Exploring"],
                  ].map(([k, v]) => (
                    <div key={k} className="p-4 bg-[#FCF8FF] border border-[#787682]/10 rounded-xl">
                      <p className="text-xs font-bold text-[#787682] uppercase tracking-widest mb-1">{k}</p>
                      <p className="font-medium text-[#1B1B26] text-sm">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-[#EFECFC] rounded-2xl border border-[#2F05EA]/10">
                  <p className="text-sm text-[#13075B] font-medium">CareerX will analyze this profile and generate your personalized career baseline and trajectories.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-10 pt-8 border-t border-[#787682]/10">
              <GhostBtn onClick={back}>{step === 0 ? "Cancel" : "← Back"}</GhostBtn>
              <PrimaryBtn onClick={next} disabled={!canNext()}>
                {step === STEPS.length - 1 ? "Generate My Baseline →" : "Next →"}
              </PrimaryBtn>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOADING
═══════════════════════════════════════════════════════════════ */
function LoadingPage() {
  const LABELS = ["Analyzing Profile...", "Computing Trajectories...", "Mapping Skill Gaps...", "Building Your Roadmap..."];
  const [label, setLabel] = useState(LABELS[0]);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % LABELS.length; setLabel(LABELS[i]); }, 1400);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12">
      <Spinner label={label} />
      <div className="flex gap-2">
        {LABELS.map((l, i) => <div key={i} className={`w-2 h-2 rounded-full transition-all ${l === label ? "bg-[#2F05EA] scale-125" : "bg-[#EFECFC]"}`} />)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE ANALYSIS
═══════════════════════════════════════════════════════════════ */
function ProfileAnalysisPage({ profile, baseline, result, onContinue }: {
  profile: UserProfile; baseline: CareerBaseline; result: SimulationResult; onContinue: () => void;
}) {
  // result used to satisfy linter — signals it was consumed
  void result;
  const strong    = baseline.signals.filter(s => s.type === "strong");
  const developing = baseline.signals.filter(s => s.type === "developing");
  const weak      = baseline.signals.filter(s => s.type === "weak");

  return (
    <div className="flex flex-col flex-1">
      <NavBar />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <div className="animate-fade-up mb-12">
          <SectionLabel>Profile Intelligence</SectionLabel>
          <h2 className="text-5xl font-black text-[#1B1B26] tracking-tight">
            {profile.name ? `${profile.name}'s` : "Your"} Career Profile
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="glass p-10 rounded-[2rem] flex flex-col items-center justify-center animate-fade-up delay-100">
            <h3 className="text-sm font-bold text-[#787682] uppercase tracking-widest mb-6">Profile Strength</h3>
            <RadialGauge score={baseline.scores.overall} size={160} stroke={12} color="#13075B" label="Score" />
            <p className="text-xs text-[#787682] mt-4 text-center max-w-[14rem]">CareerX estimate based on your submitted profile</p>
          </div>
          <div className="glass p-8 rounded-[2rem] md:col-span-2 animate-fade-up delay-200">
            <div className="grid grid-cols-2 gap-8 h-full">
              <div>
                <h4 className="font-bold text-[#13075B] mb-4 flex items-center gap-2"><span className="text-emerald-500">●</span> Strong</h4>
                <ul className="space-y-2">{strong.map(s => <li key={s.label} className="text-[#474551] font-medium flex gap-2 text-sm"><span className="text-emerald-400 mt-0.5">✓</span>{s.label}</li>)}</ul>
              </div>
              <div>
                <h4 className="font-bold text-[#1B1B26] mb-4 flex items-center gap-2"><span className="text-amber-500">◐</span> Developing</h4>
                <ul className="space-y-2">{developing.map(s => <li key={s.label} className="text-[#474551] flex gap-2 text-sm"><span className="text-amber-400 mt-0.5">◐</span>{s.label}</li>)}</ul>
              </div>
              <div className="col-span-2 pt-5 border-t border-[#787682]/10">
                <h4 className="font-bold text-red-600 mb-3 text-xs uppercase tracking-widest">Needs Attention</h4>
                <div className="flex flex-wrap gap-2">{weak.map(s => <span key={s.label} className="px-3 py-1 bg-red-50 text-red-700 rounded-md text-sm font-bold border border-red-100">○ {s.label}</span>)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-up delay-300 mb-12">
          <div className="bg-[#EFECFC] p-8 rounded-[2rem] border border-[#2F05EA]/10">
            <h4 className="text-sm font-bold text-[#2F05EA] uppercase tracking-widest mb-3">Career Intelligence Signal</h4>
            <p className="text-[#13075B] text-lg font-medium leading-relaxed">{baseline.insight}</p>
          </div>
          <div className="bg-[#FCF8FF] p-8 rounded-[2rem] border border-[#787682]/20">
            <h4 className="text-sm font-bold text-[#1B1B26] uppercase tracking-widest mb-3">Highest-Value Improvement</h4>
            <p className="text-[#474551] text-lg leading-relaxed">{baseline.biggestOpportunity}</p>
          </div>
        </div>

        <div className="flex items-center justify-between animate-fade-up delay-400 p-6 bg-[#13075B] rounded-2xl text-white">
          <div>
            <h4 className="font-bold text-lg">CareerX has enough information to generate your baseline.</h4>
            <p className="text-indigo-200 text-sm mt-1">Next: Career Baseline Dashboard</p>
          </div>
          <PrimaryBtn onClick={onContinue} className="bg-white !text-[#13075B] hover:!bg-[#EFECFC] hover:!text-[#2F05EA] flex-shrink-0">
            View Career Baseline →
          </PrimaryBtn>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAREER BASELINE DASHBOARD
═══════════════════════════════════════════════════════════════ */
function BaselineDashboardPage({ baseline, profile, onContinue, onBack }: {
  baseline: CareerBaseline; profile: UserProfile; onContinue: () => void; onBack: () => void;
}) {
  const dims = [
    { label: "Technical Skills",      value: baseline.scores.technicalSkills },
    { label: "Problem Solving",       value: baseline.scores.problemSolving },
    { label: "Project Depth",         value: baseline.scores.projectDepth },
    { label: "Production Readiness",  value: baseline.scores.productionReadiness },
    { label: "Career Clarity",        value: baseline.scores.careerClarity },
    { label: "Communication",         value: baseline.scores.communication },
  ];

  return (
    <div className="flex flex-col flex-1">
      <NavBar right={<GhostBtn onClick={onBack}>← Analysis</GhostBtn>} />
      <main className="flex-1 max-w-[1400px] mx-auto px-6 py-12 w-full">
        <SectionLabel>Career Baseline</SectionLabel>
        <h2 className="text-5xl font-black text-[#1B1B26] mb-12 tracking-tight">{profile.name ? `${profile.name}'s` : "Your"} Baseline Dashboard</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
          <div className="glass p-10 rounded-[2rem] flex flex-col items-center justify-center animate-fade-up">
            <p className="text-sm font-bold text-[#787682] uppercase tracking-widest mb-6">Career Readiness</p>
            <RadialGauge score={baseline.scores.overall} size={200} stroke={14} color="#13075B" label="Ready" />
            <p className="text-xs text-[#787682] mt-6 text-center">CareerX estimate</p>
          </div>
          <div className="glass p-10 rounded-[2rem] lg:col-span-2 animate-fade-up delay-100">
            <h3 className="font-bold text-[#1B1B26] mb-8">Readiness Dimensions</h3>
            <div className="flex flex-col gap-5">
              {dims.map((d, i) => <SkillBar key={d.label} label={d.label} value={d.value} delay={i * 80} />)}
            </div>
          </div>
        </div>

        <div className="glass p-10 rounded-[2rem] mb-10 animate-fade-up delay-200">
          <h3 className="font-bold text-[#1B1B26] mb-8">Profile Signal Map</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(["strong", "developing", "weak"] as const).map(type => (
              <div key={type}>
                <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${
                  type === "strong" ? "text-emerald-600" : type === "developing" ? "text-amber-600" : "text-red-600"}`}>
                  {type === "strong" ? "Strong" : type === "developing" ? "Developing" : "Needs Attention"}
                </h4>
                <ul className="space-y-3">
                  {baseline.signals.filter(s => s.type === type).map(s => (
                    <li key={s.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        type === "strong" ? "bg-emerald-500" : type === "developing" ? "border-2 border-amber-500" : "border-2 border-red-400"}`} />
                      <span className="font-medium text-[#1B1B26] text-sm">{s.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-fade-up delay-300">
          <div className="bg-[#FCF8FF] p-8 rounded-[2rem] border border-[#787682]/20">
            <h4 className="font-bold text-[#1B1B26] mb-3">What This Means</h4>
            <p className="text-[#474551] leading-relaxed">{baseline.insight}</p>
          </div>
          <div className="bg-[#EFECFC] p-8 rounded-[2rem] border border-[#2F05EA]/10">
            <h4 className="font-bold text-[#13075B] mb-3">Biggest Opportunity</h4>
            <p className="text-[#29236F] leading-relaxed mb-6">{baseline.biggestOpportunity}</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-[#787682]">Production Readiness</span>
              <span className="font-black text-red-500 text-xl">{baseline.scores.productionReadiness}</span>
              <span className="text-[#787682]">→</span>
              <span className="font-black text-emerald-600 text-xl">{baseline.productionPotential}+</span>
            </div>
            <p className="text-xs text-[#787682] mt-2">CareerX estimate after recommended project</p>
          </div>
        </div>

        <div className="flex justify-end animate-fade-up delay-400">
          <PrimaryBtn onClick={onContinue} size="lg">Generate Career Trajectories →</PrimaryBtn>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESULTS — THREE TRAJECTORIES
═══════════════════════════════════════════════════════════════ */
function ResultsPage({ result, profile, onSelectPath, onRerun, session, onLogout }: {
  result: SimulationResult; profile: UserProfile;
  onSelectPath: (p: CareerPath) => void; onRerun: () => void;
  session: { name: string; email: string } | null; onLogout: () => void;
}) {
  const sorted = [...result.paths].sort((a, b) => b.fitScore - a.fitScore);
  const ACCENTS = [
    { barBg: "bg-[#13075B]", pct: "text-[#13075B]" },
    { barBg: "bg-[#2F05EA]", pct: "text-[#2F05EA]" },
    { barBg: "bg-[#001F1A]", pct: "text-[#474551]" },
  ];

  return (
    <div className="flex flex-col flex-1">
      <NavBar right={
        <div className="flex items-center gap-3">
          {session && <span className="text-sm text-[#474551] hidden md:block">Hello, {session.name}</span>}
          <GhostBtn onClick={onRerun}>Edit Profile</GhostBtn>
          <GhostBtn onClick={onLogout}>Sign Out</GhostBtn>
        </div>
      } />
      <main className="flex-1 max-w-[1600px] mx-auto px-6 py-12 w-full">
        <SectionLabel>Career Trajectories — Part 1</SectionLabel>
        <h2 className="text-5xl font-black text-[#1B1B26] mb-4 tracking-tight">Your Three Futures</h2>
        <p className="text-xl text-[#474551] mb-16 max-w-3xl">Based on your profile, CareerX identified these realistic career directions. Select a path to enter the deep analysis.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {sorted.map((path, idx) => {
            const acc = ACCENTS[idx % ACCENTS.length];
            return (
              <div key={path.title} onClick={() => onSelectPath(path)}
                className="glass card-hover p-8 rounded-[2rem] cursor-pointer flex flex-col h-full relative overflow-hidden group animate-fade-up"
                style={{ animationDelay: `${idx * 100}ms` }}>
                <div className={`absolute top-0 left-0 w-full h-1.5 opacity-30 group-hover:opacity-100 transition-opacity ${acc.barBg}`} />

                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs font-bold text-[#787682] uppercase tracking-widest">Path {String(idx + 1).padStart(2, "0")}</span>
                  <span className={`text-3xl font-black ${acc.pct}`}>{path.fitScore}%</span>
                </div>
                <h3 className="text-2xl font-black text-[#1B1B26] mb-3">{path.title}</h3>
                <p className="text-sm text-[#474551] mb-6 flex-1 leading-relaxed">{path.summary}</p>

                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="text-xs font-bold text-[#787682] uppercase mb-2">You already have</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.strongSkills.slice(0, 3).map(s => (
                        <span key={s} className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 font-medium">✓ {s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#787682] uppercase mb-2">You need</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {path.skillGaps.slice(0, 3).map(g => (
                        <span key={g.skill} className="text-xs px-2.5 py-1 bg-[#FCF8FF] text-[#1B1B26] rounded border border-[#787682]/20">○ {g.skill}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-[#787682]/10 space-y-1.5 mb-5">
                  <p className="text-sm text-[#474551]"><span className="font-bold text-[#13075B]">Timeline: </span>12–18 months</p>
                  <p className="text-sm text-[#474551]"><span className="font-bold text-[#13075B]">First step: </span>{path.skillGaps[0]?.skill || "Core fundamentals"}</p>
                </div>

                <div className="py-3 bg-[#EFECFC] text-[#2F05EA] font-bold rounded-xl text-center text-sm group-hover:bg-[#2F05EA] group-hover:text-white transition-colors">
                  Deep Analysis →
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL PAGE — CAREER INTELLIGENCE DASHBOARD
═══════════════════════════════════════════════════════════════ */
function DetailPage({ path, profile, persistProfile, onBack, onOpenLearning, onOpenProject, onOpenResume, onOpenInterview }: {
  path: CareerPath; profile: UserProfile; persistProfile: (p: UserProfile) => void;
  onBack: () => void;
  onOpenLearning: (topic: string) => void;
  onOpenProject: (proj: CareerPath["projects"][number]) => void;
  onOpenResume: () => void;
  onOpenInterview: () => void;
}) {
  const [matchOpen, setMatchOpen] = useState(false);
  const readiness = profile.readiness || path.fitScore;
  const topGap = path.skillGaps[0]?.skill || "System Design";

  const toggleTask = (task: string) => {
    const tasks = profile.completedTasks.includes(task)
      ? profile.completedTasks.filter(t => t !== task)
      : [...profile.completedTasks, task];
    const taskBonus = Math.round(tasks.length * 0.5);
    const modBonus  = profile.completedModules.length * 2;
    const projBonus = profile.completedProjects.length * 5;
    const resBonus  = profile.resumeOptimized ? 4 : 0;
    const intBonus  = profile.interviewScore ? Math.floor(profile.interviewScore * 0.05) : 0;
    const base      = path.fitScore;
    const newReadiness = Math.min(100, base + taskBonus + modBonus + projBonus + resBonus + intBonus);
    persistProfile({ ...profile, completedTasks: tasks, readiness: newReadiness });
  };

  return (
    <div className="flex flex-col flex-1">
      <NavBar right={<GhostBtn onClick={onBack}>← Trajectories</GhostBtn>} />
      <main className="flex-1 max-w-[1600px] mx-auto px-6 py-12 pb-32 w-full">
        {/* Hero */}
        <div className="animate-fade-up flex flex-col lg:flex-row gap-8 mb-12 items-start">
          <RadialGauge score={readiness} size={160} stroke={12} color="#13075B" label="Ready"
            interactive onClick={() => setMatchOpen(true)} />
          <div className="flex-1">
            <SectionLabel>Trajectories — Part 2 / Deep Analysis</SectionLabel>
            <h2 className="text-4xl lg:text-6xl font-black text-[#1B1B26] mb-4 tracking-tight">{path.title}</h2>
            <p className="text-lg text-[#474551] max-w-4xl leading-relaxed">{path.summary}</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <InsightCard title="Readiness" value={`${readiness}%`} subtitle="CareerX estimate" accent="indigo" />
          <InsightCard title="Top Strength" value={profile.strongSkills[0] || "Python"} subtitle="Key asset for this role" />
          <InsightCard title="Biggest Gap" value={topGap} subtitle="Critical for role" accent="amber" />
          <InsightCard title="Timeline" value="12–18 mo" subtitle="To role readiness" accent="emerald" />
        </div>

        {/* Action center */}
        <div className="glass p-8 rounded-[2rem] mb-12 animate-fade-up delay-100">
          <SectionLabel>Next Best Actions</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ActionCard priority="high" title={`Learn ${topGap}`} reason="Your largest current skill gap for this role." cta="Start Learning" onClick={() => onOpenLearning(topGap)} />
            <ActionCard priority="medium" title="Optimize Resume" reason="Project bullets lack measurable impact metrics." cta="Open Resume Studio" onClick={onOpenResume} />
            <ActionCard priority="low" title="Practice Interview" reason={`${readiness}% readiness — a good time to prepare.`} cta="Start AI Interview" onClick={onOpenInterview} />
          </div>
        </div>

        {/* Skill map */}
        <div className="glass p-8 lg:p-12 rounded-[2rem] mb-12 animate-fade-up delay-200">
          <SectionLabel>Skill Analysis</SectionLabel>
          <div className="flex flex-col gap-4">
            {path.skillGaps.map(sg => (
              <div key={sg.skill} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-[#FCF8FF] border border-[#787682]/10">
                <div className="flex-1">
                  <h4 className="font-bold text-[#1B1B26] mb-1">{sg.skill}</h4>
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                    sg.importance === "high" ? "bg-red-50 text-red-600" :
                    sg.importance === "medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {sg.importance} priority
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#787682] w-12">Current</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div key={lvl} className={`w-7 h-2.5 rounded-sm ${
                        lvl <= sg.currentLevel ? "bg-[#13075B]" :
                        lvl <= sg.targetLevel ? "bg-[#EFECFC] border border-[#2F05EA]/30" : "bg-[#F3F1F8]"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-[#787682] w-12">Target {sg.targetLevel}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className="glass p-8 lg:p-12 rounded-[2rem] mb-12 animate-fade-up delay-300">
          <SectionLabel>Career Roadmap</SectionLabel>
          <RoadmapView path={path} completedTasks={profile.completedTasks} toggleTask={toggleTask} />
        </div>

        {/* 30-day plan */}
        <div className="glass p-8 lg:p-12 rounded-[2rem] mb-12 animate-fade-up delay-400 overflow-x-auto">
          <SectionLabel>Interactive 30-Day Plan</SectionLabel>
          <TimelineView path={path} completedTasks={profile.completedTasks} toggleTask={toggleTask} />
        </div>

        {/* Projects */}
        <div className="glass p-8 lg:p-12 rounded-[2rem] animate-fade-up delay-500">
          <SectionLabel>Project Portfolio</SectionLabel>
          <ProjectsGrid path={path} completedProjects={profile.completedProjects} onOpenProject={onOpenProject} />
        </div>
      </main>

      {/* Role match modal */}
      <Modal open={matchOpen} onClose={() => setMatchOpen(false)}>
        <SectionLabel>Role Match Analyzer</SectionLabel>
        <h2 className="text-3xl font-black text-[#1B1B26] mb-2">{path.title}</h2>
        <div className="flex items-center gap-4 mb-8">
          <span className="text-5xl font-black text-[#13075B]">{path.fitScore}%</span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-100">Competitive Match</span>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-xs font-bold text-[#787682] uppercase tracking-widest mb-3">You Have</h4>
            {profile.strongSkills.slice(0, 4).map(s => (
              <div key={s} className="flex items-center gap-2 mb-2 text-[#1B1B26] font-medium text-sm"><span className="text-emerald-500">✓</span> {s}</div>
            ))}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#787682] uppercase tracking-widest mb-3">You Need</h4>
            {path.skillGaps.map(g => (
              <div key={g.skill} className="flex items-center gap-2 mb-2 text-[#1B1B26] font-medium text-sm"><span className="text-amber-500">!</span> {g.skill}</div>
            ))}
          </div>
        </div>
        <div className="p-5 bg-[#FCF8FF] border border-[#29236F]/10 rounded-2xl mb-6">
          <p className="text-[#474551] leading-relaxed text-sm">{path.fitReason}</p>
        </div>
        <PrimaryBtn onClick={() => setMatchOpen(false)} className="w-full">Return to Dashboard</PrimaryBtn>
      </Modal>
    </div>
  );
}

function RoadmapView({ path, completedTasks, toggleTask }: { path: CareerPath; completedTasks: string[]; toggleTask: (t: string) => void }) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 pt-4">
      {path.milestones.map((m, i) => {
        const done = m.goals.filter(g => completedTasks.includes(g)).length;
        const pct  = Math.round((done / m.goals.length) * 100);
        return (
          <div key={i} className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-5 h-5 rounded-full border-4 border-white flex-shrink-0 ${pct === 100 ? "bg-emerald-500" : "bg-[#2F05EA]"}`}
                style={{ boxShadow: "0 0 12px rgba(47,5,234,0.4)" }} />
              <h4 className="text-sm font-black text-[#13075B] uppercase tracking-wide">{m.yearLabel}</h4>
              <span className="text-xs font-bold text-[#787682] ml-auto">{pct}%</span>
            </div>
            <div className="bg-[#FCF8FF] p-5 rounded-2xl border border-[#787682]/10">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {m.skillsToLearn.map(s => <span key={s} className="text-xs bg-white border border-[#787682]/15 px-2 py-1 rounded font-medium text-[#474551]">{s}</span>)}
              </div>
              <ul className="space-y-3">
                {m.goals.map((g, j) => (
                  <li key={j} onClick={() => toggleTask(g)} className="flex items-start gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      completedTasks.includes(g) ? "bg-[#2F05EA] border-[#2F05EA] text-white" : "border-[#787682]/30 group-hover:border-[#2F05EA]/50"}`}>
                      {completedTasks.includes(g) && <span className="text-xs font-bold">✓</span>}
                    </div>
                    <span className={`text-sm leading-relaxed ${completedTasks.includes(g) ? "line-through text-[#787682]" : "text-[#474551]"}`}>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineView({ path, completedTasks, toggleTask }: { path: CareerPath; completedTasks: string[]; toggleTask: (t: string) => void }) {
  const sorted = [...path.first30Days].sort((a, b) => a.week - b.week);
  return (
    <div className="flex min-w-max gap-0">
      {sorted.map((w, i) => (
        <div key={w.week} className="w-72 lg:w-80 relative">
          <div className="absolute top-[10px] left-6 right-0 h-0.5 bg-[#EFECFC]" style={{ display: i === sorted.length - 1 ? "none" : "block" }} />
          <div className="absolute top-[2px] left-5 w-5 h-5 rounded-full bg-white border-4 border-[#EFECFC]" />
          <div className="pt-8 pr-8 pl-5">
            <h4 className="text-base font-black text-[#13075B] mb-4">Week {w.week}</h4>
            <ul className="space-y-3">
              {w.tasks.map((task, j) => (
                <li key={j} onClick={() => toggleTask(task)} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" readOnly checked={completedTasks.includes(task)}
                    className="mt-1 w-4 h-4 accent-[#2F05EA] flex-shrink-0" aria-label={task} />
                  <span className={`text-sm leading-relaxed ${completedTasks.includes(task) ? "line-through text-[#787682]" : "text-[#474551]"}`}>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsGrid({ path, completedProjects, onOpenProject }: {
  path: CareerPath; completedProjects: string[]; onOpenProject: (p: CareerPath["projects"][number]) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
      {path.projects.map((proj, i) => {
        const done = completedProjects.includes(proj.name);
        return (
          <div key={i} onClick={() => onOpenProject(proj)}
            className={`bg-white border p-8 rounded-2xl flex flex-col cursor-pointer transition-all shadow-sm hover:-translate-y-1 hover:shadow-xl ${
              done ? "border-emerald-200" : "border-[#787682]/15 hover:border-[#2F05EA]/30"}`}>
            <div className="flex justify-between items-center mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${done ? "bg-emerald-100 text-emerald-700" : "bg-[#EFECFC] text-[#13075B]"}`}>
                {done ? "✓" : `0${i + 1}`}
              </div>
              <span className="text-xs font-bold uppercase px-3 py-1 bg-amber-50 text-amber-700 rounded-full">{proj.weeks}w • {proj.difficulty}</span>
            </div>
            <h4 className="text-xl font-black text-[#1B1B26] mb-3">{proj.name}</h4>
            <p className="text-sm text-[#474551] flex-1 mb-6 leading-relaxed">{proj.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {proj.skillsPracticed.map(s => <span key={s} className="text-xs px-2 py-1 bg-[#FCF8FF] border border-[#787682]/10 rounded text-[#474551]">{s}</span>)}
            </div>
            <div className="py-2.5 bg-[#EFECFC] text-[#2F05EA] font-bold rounded-lg text-center text-sm hover:bg-[#2F05EA] hover:text-white transition-colors">
              View Project →
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEARNING TRACK
═══════════════════════════════════════════════════════════════ */
function LearningTrackPage({ topic, path, profile, persistProfile, onBack }: {
  topic: string; path: CareerPath; profile: UserProfile;
  persistProfile: (p: UserProfile) => void; onBack: () => void;
}) {
  const [activeLesson, setActiveLesson] = useState(false);
  const isCompleted = profile.completedModules.includes(topic);
  const progress = isCompleted ? 100 : 42;

  const lesson = {
    concept: `Understanding ${topic} starts with its fundamental data structures and how they enable efficient computation. ${topic} provides powerful abstractions that are essential for modern AI workflows.`,
    code: `import torch\n# Create a 2D tensor\nx = torch.tensor([[1.0, 2.0], [3.0, 4.0]])\nprint(x.shape)  # torch.Size([2, 2])\nprint(x.dtype)  # torch.float32\n\n# Tensor operations\ny = x.T  # Transpose\nz = x @ y  # Matrix multiplication`,
    question: `What does torch.zeros(3, 4).shape return?`,
    answers: ["torch.Size([3])", "torch.Size([3, 4])", "torch.Size([4, 3])", "Error"],
    correct: 1,
  };

  const modules = [
    { num: "01", title: `${topic} Foundations`, topics: ["Core Concepts", "Data Structures", "Operations", "Autograd"], open: true },
    { num: "02", title: "Model Architecture", topics: ["Layers", "Activation Functions", "Forward Pass", "Loss"], open: false },
    { num: "03", title: "Training & Optimization", topics: ["Optimizers", "Backprop", "Training Loop", "Validation"], open: false },
    { num: "04", title: "Deployment", topics: ["Model Export", "FastAPI", "Docker", "Inference"], open: false },
  ];

  const markComplete = () => {
    if (!isCompleted) {
      const newMods = [...profile.completedModules, topic];
      const modBonus = newMods.length * 2;
      const base = path.fitScore;
      const taskBonus = Math.round(profile.completedTasks.length * 0.5);
      persistProfile({ ...profile, completedModules: newMods, readiness: Math.min(100, base + taskBonus + modBonus) });
    }
    setActiveLesson(false);
  };

  if (activeLesson) {
    return <LessonView lesson={lesson} topic={topic} onBack={() => setActiveLesson(false)} onComplete={markComplete} isCompleted={isCompleted} />;
  }

  return (
    <div className="flex flex-col flex-1">
      <NavBar right={<GhostBtn onClick={onBack}>← Dashboard</GhostBtn>} />
      <main className="flex-1 max-w-[1000px] mx-auto px-6 py-12 w-full">
        <SectionLabel>Learning Track</SectionLabel>
        <h2 className="text-5xl font-black text-[#1B1B26] mb-2 tracking-tight">{topic}</h2>
        <p className="text-[#474551] mb-8 text-lg">CareerX identified this as a critical skill gap for {path.title}.</p>

        <div className="flex items-center gap-6 mb-10">
          <div className="flex-1 bg-[#EFECFC] h-3 rounded-full overflow-hidden">
            <div className="bg-[#2F05EA] h-full transition-all duration-1000 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-black text-2xl text-[#13075B] w-16 text-right">{progress}%</span>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-12">
          <div className="glass p-5 rounded-2xl"><p className="text-xs font-bold text-[#787682] uppercase mb-1">Duration</p><p className="font-bold text-[#1B1B26]">6 Weeks</p></div>
          <div className="glass p-5 rounded-2xl"><p className="text-xs font-bold text-[#787682] uppercase mb-1">Level</p><p className="font-bold text-[#1B1B26]">Beginner → Inter.</p></div>
          <div className="glass p-5 rounded-2xl"><p className="text-xs font-bold text-[#787682] uppercase mb-1">Impact</p><p className="font-bold text-emerald-600">High Value</p></div>
        </div>

        <h3 className="text-2xl font-bold text-[#1B1B26] mb-6">Learning Modules</h3>
        <div className="space-y-4">
          {modules.map((mod, i) => (
            <div key={i}
              onClick={mod.open ? () => setActiveLesson(true) : undefined}
              className={`glass p-6 rounded-2xl flex items-center gap-6 transition-all ${mod.open ? "cursor-pointer hover:border-[#2F05EA]/50 hover:shadow-lg hover:-translate-y-0.5" : "opacity-50 cursor-not-allowed"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${i === 0 ? "bg-[#EFECFC] text-[#13075B]" : "bg-[#F3F1F8] text-[#787682]"}`}>
                {mod.num}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-[#1B1B26] mb-2">{mod.title}</h4>
                <div className="flex flex-wrap gap-2">
                  {mod.topics.map(t => <span key={t} className="text-xs px-2 py-1 bg-[#FCF8FF] border border-[#787682]/15 rounded text-[#474551]">{t}</span>)}
                </div>
              </div>
              {mod.open ? (
                <span className="text-[#2F05EA] font-bold text-sm flex-shrink-0">
                  {isCompleted ? "Review →" : "Start →"}
                </span>
              ) : (
                <span className="text-[#787682] text-sm flex-shrink-0">Locked</span>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function LessonView({ lesson, topic, onBack, onComplete, isCompleted }: {
  lesson: { concept: string; code: string; question: string; answers: string[]; correct: number };
  topic: string; onBack: () => void; onComplete: () => void; isCompleted: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const correct = selected === lesson.correct;
  return (
    <div className="flex flex-col flex-1">
      <NavBar right={<GhostBtn onClick={onBack}>✕ Close Session</GhostBtn>} />
      <main className="flex-1 max-w-[800px] mx-auto px-6 py-12 w-full">
        <SectionLabel>Learning Session — {topic}</SectionLabel>
        <h2 className="text-4xl font-black text-[#1B1B26] mb-4">{topic} Foundations</h2>
        <div className="h-2 bg-[#EFECFC] rounded-full mb-10"><div className="w-[60%] h-full bg-[#2F05EA] rounded-full" /></div>

        <div className="glass p-8 rounded-2xl mb-8">
          <h3 className="text-xl font-bold text-[#13075B] mb-4">Core Concept</h3>
          <p className="text-[#474551] leading-relaxed text-lg">{lesson.concept}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold text-[#13075B] mb-4">Code Example</h3>
          <div className="bg-[#1B1B26] p-6 rounded-2xl overflow-x-auto">
            <pre className="text-emerald-400 font-mono text-sm whitespace-pre">{lesson.code}</pre>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl bg-[#FCF8FF] mb-10">
          <h3 className="text-xl font-bold text-[#1B1B26] mb-4">Interactive Challenge</h3>
          <p className="text-[#474551] mb-6 font-medium">{lesson.question}</p>
          <div className="space-y-3">
            {lesson.answers.map((ans, i) => (
              <button key={i} onClick={() => setSelected(i)}
                className={`w-full text-left p-4 rounded-xl border transition-all font-medium text-sm ${
                  selected === null ? "bg-white border-[#787682]/20 hover:border-[#2F05EA]/50 text-[#474551]" :
                  i === lesson.correct ? "bg-emerald-50 border-emerald-500 text-emerald-800" :
                  selected === i ? "bg-red-50 border-red-400 text-red-700" :
                  "bg-white border-[#787682]/20 opacity-60 text-[#474551]"}`}>
                {ans}
              </button>
            ))}
          </div>
          {selected !== null && correct && (
            <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-800 animate-fade-up text-sm">
              ✓ Correct! Shape is always defined by the arguments to the tensor constructor.
            </div>
          )}
          {selected !== null && !correct && (
            <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-fade-up text-sm">
              Not quite. Recall: torch.zeros(rows, cols) creates a tensor of shape [rows, cols].
            </div>
          )}
        </div>

        <PrimaryBtn onClick={onComplete} disabled={!correct && !isCompleted} className="w-full py-4">
          {isCompleted ? "Return to Learning Track" : "Mark Complete & Return"}
        </PrimaryBtn>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROJECT DETAIL
═══════════════════════════════════════════════════════════════ */
function ProjectDetailPage({ project, path, profile, persistProfile, onBack }: {
  project: CareerPath["projects"][number]; path: CareerPath;
  profile: UserProfile; persistProfile: (p: UserProfile) => void; onBack: () => void;
}) {
  const isSubmitted = profile.completedProjects.includes(project.name);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const MILESTONES = [
    { title: "Milestone 01 — Setup",    tasks: ["Initialize project repository", "Create virtual environment", "Install dependencies", "Write README"] },
    { title: "Milestone 02 — Data",     tasks: ["Download and inspect dataset", "Handle missing values", "Clean and normalize features", "Train/test split"] },
    { title: "Milestone 03 — Model",    tasks: ["Build baseline model", "Train and evaluate", "Compare metrics", "Save model checkpoint"] },
    { title: "Milestone 04 — Deploy",   tasks: ["Create REST API endpoint", "Write documentation", "Publish to GitHub", "Demo ready"] },
  ];

  const total    = MILESTONES.reduce((a, m) => a + m.tasks.length, 0);
  const progress = Math.round((checked.size / total) * 100);

  const toggle = (task: string) => setChecked(prev => {
    const n = new Set(prev); n.has(task) ? n.delete(task) : n.add(task); return n;
  });

  const submit = () => {
    const newProjs = [...profile.completedProjects, project.name];
    const projBonus = newProjs.length * 5;
    const base      = path.fitScore;
    const taskBonus = Math.round(profile.completedTasks.length * 0.5);
    const modBonus  = profile.completedModules.length * 2;
    persistProfile({ ...profile, completedProjects: newProjs, readiness: Math.min(100, base + taskBonus + modBonus + projBonus) });
  };

  return (
    <div className="flex flex-col flex-1">
      <NavBar right={<GhostBtn onClick={onBack}>← Dashboard</GhostBtn>} />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <SectionLabel>Project Workspace</SectionLabel>
          <h2 className="text-4xl font-black text-[#1B1B26] mb-4 tracking-tight">{project.name}</h2>
          <p className="text-xl text-[#474551] mb-8 leading-relaxed">{project.description}</p>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 bg-[#EFECFC] h-3 rounded-full overflow-hidden">
              <div className="bg-[#2F05EA] h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-bold text-[#13075B] w-12 text-right">{progress}%</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-10">
            {["Data", "Model", "API", "Deploy"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className="px-4 py-2 bg-[#13075B] text-white rounded-lg text-sm font-bold">0{i + 1} {s}</span>
                {i < 3 && <span className="text-[#787682] text-sm">→</span>}
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {MILESTONES.map(ms => (
              <div key={ms.title} className="glass p-8 rounded-2xl">
                <h4 className="font-bold text-[#13075B] mb-5">{ms.title}</h4>
                <ul className="space-y-3">
                  {ms.tasks.map(task => (
                    <li key={task} onClick={() => toggle(task)}
                      className="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-[#FCF8FF] transition-colors">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        checked.has(task) ? "bg-[#2F05EA] border-[#2F05EA] text-white" : "border-[#787682]/30 group-hover:border-[#2F05EA]/50"}`}>
                        {checked.has(task) && <span className="text-xs font-bold">✓</span>}
                      </div>
                      <span className={`text-sm ${checked.has(task) ? "line-through text-[#787682]" : "text-[#474551]"}`}>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl">
            <h4 className="text-xs font-bold text-[#787682] uppercase tracking-widest mb-4">Career Relevance</h4>
            {[[path.title, 5], ["Data Scientist", 4], ["Software Engineer", 3]].map(([role, stars]) => (
              <div key={String(role)} className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm text-[#1B1B26] truncate mr-2">{role}</span>
                <span className="text-amber-500 tracking-widest text-sm flex-shrink-0">{"★".repeat(Number(stars))}{"☆".repeat(5 - Number(stars))}</span>
              </div>
            ))}
          </div>

          <div className="glass p-6 rounded-2xl">
            <h4 className="text-xs font-bold text-[#787682] uppercase tracking-widest mb-4">Skills Gained</h4>
            {project.skillsPracticed.map(s => (
              <div key={s} className="flex justify-between items-center mb-2">
                <span className="text-[#474551] text-sm">{s}</span>
                <span className="text-emerald-600 font-bold text-sm">+10 pts</span>
              </div>
            ))}
          </div>

          <div className="glass p-6 rounded-2xl bg-[#FCF8FF]">
            <h4 className="text-xs font-bold text-[#787682] uppercase tracking-widest mb-3">Portfolio Value</h4>
            <p className="text-sm text-[#474551] leading-relaxed mb-4">
              This project demonstrates {project.skillsPracticed.join(", ")} to employers for {path.title} roles.
            </p>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold uppercase">High Portfolio Value</span>
          </div>

          <PrimaryBtn onClick={submit} disabled={isSubmitted} className="w-full py-4">
            {isSubmitted ? "✓ Project Submitted" : "Submit Final Project"}
          </PrimaryBtn>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESUME STUDIO
═══════════════════════════════════════════════════════════════ */
function ResumeStudioPage({ path, profile, persistProfile, onBack }: {
  path: CareerPath; profile: UserProfile; persistProfile: (p: UserProfile) => void; onBack: () => void;
}) {
  const [resumeText, setResumeText] = useState(profile.resumeText || "");
  const [targetRole, setTargetRole] = useState(path.title);
  const [analyzed, setAnalyzed] = useState(profile.resumeScore > 0);
  const [optimized, setOptimized] = useState(profile.resumeOptimized);

  const analyze = () => {
    persistProfile({ ...profile, resumeText, resumeScore: 78 });
    setAnalyzed(true);
  };

  const applyOptimize = () => {
    persistProfile({ ...profile, resumeOptimized: true });
    setOptimized(true);
  };

  return (
    <div className="flex flex-col flex-1">
      <NavBar right={<GhostBtn onClick={onBack}>← Dashboard</GhostBtn>} />
      <main className="flex-1 max-w-[1400px] mx-auto px-6 py-12 w-full">
        <SectionLabel>Resume Studio</SectionLabel>
        <h2 className="text-5xl font-black text-[#1B1B26] mb-2 tracking-tight">Resume Studio</h2>
        <p className="text-xl text-[#474551] mb-12">Turn your current resume into a stronger version for the career path you are targeting.</p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-8 rounded-[2rem]">
              <h3 className="font-bold text-[#1B1B26] mb-4">Target Role</h3>
              <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#787682]/30 bg-white focus:border-[#2F05EA] outline-none mb-6 text-[#1B1B26]">
                <option>AI/ML Engineer</option>
                <option>Data Scientist</option>
                <option>Software Engineer</option>
                <option>Backend Engineer</option>
                <option>Research Scientist</option>
              </select>

              <h3 className="font-bold text-[#1B1B26] mb-3">Your Resume</h3>
              <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                className="w-full h-40 p-4 rounded-xl border border-[#787682]/30 bg-white focus:border-[#2F05EA] outline-none resize-none text-sm mb-4 text-[#1B1B26]" />

              {!analyzed ? (
                <PrimaryBtn onClick={analyze} disabled={!resumeText.trim()} className="w-full">Analyze Resume</PrimaryBtn>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass p-5 rounded-2xl text-center">
                      <p className="text-xs font-bold text-[#787682] uppercase mb-1">Score</p>
                      <p className="text-3xl font-black text-[#1B1B26]">{optimized ? 92 : 78}<span className="text-sm text-[#787682]">/100</span></p>
                    </div>
                    <div className="glass p-5 rounded-2xl text-center">
                      <p className="text-xs font-bold text-[#787682] uppercase mb-1">Role Match</p>
                      <p className="text-3xl font-black text-[#2F05EA]">{optimized ? "84%" : "72%"}</p>
                    </div>
                  </div>

                  <div className="glass p-5 rounded-2xl">
                    <h4 className="font-bold text-[#13075B] mb-3 text-xs uppercase tracking-widest">Diagnostics</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex gap-2 text-[#474551]"><span className="text-emerald-500">✓</span> Strong technical baseline</li>
                      {!optimized && <li className="flex gap-2 text-[#474551]"><span className="text-red-500">⚠</span> Projects lack measurable impact</li>}
                      {!optimized && <li className="flex gap-2 text-[#474551]"><span className="text-red-500">⚠</span> Missing {targetRole} keywords</li>}
                      {optimized && <li className="flex gap-2 text-[#474551]"><span className="text-emerald-500">✓</span> Action verbs optimized</li>}
                      {optimized && <li className="flex gap-2 text-[#474551]"><span className="text-emerald-500">✓</span> Metrics added to projects</li>}
                    </ul>
                  </div>

                  {!optimized ? (
                    <PrimaryBtn onClick={applyOptimize} className="w-full">Apply Smart Improvements</PrimaryBtn>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-center text-sm">
                      ✓ Resume Optimized (+4% Readiness)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {analyzed && (
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className={`glass p-8 rounded-[2rem] transition-all ${optimized ? "opacity-40 grayscale" : ""}`}>
                <h4 className="text-sm font-bold text-[#787682] uppercase tracking-widest mb-6">Original</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-[#F3F1F8] rounded-xl text-sm font-mono text-[#474551]">{`"Built a machine learning project using Python."`}</div>
                  <div className="p-4 bg-[#F3F1F8] rounded-xl text-sm font-mono text-[#474551]">{`"Familiar with web development and APIs."`}</div>
                </div>
              </div>
              <div className={`glass p-8 rounded-[2rem] border-2 transition-all ${optimized ? "border-[#2F05EA] shadow-[0_0_30px_rgba(47,5,234,0.1)]" : "border-transparent opacity-40"}`}>
                <h4 className="text-sm font-bold text-[#2F05EA] uppercase tracking-widest mb-6">Optimized for {targetRole}</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-[#FCF8FF] border border-[#2F05EA]/20 rounded-xl text-sm font-mono text-[#1B1B26]">{`"Built and evaluated a Python-based regression pipeline on a 10,000-row dataset, improving prediction accuracy by 18% through systematic feature engineering."`}</div>
                  <div className="p-4 bg-[#FCF8FF] border border-[#2F05EA]/20 rounded-xl text-sm font-mono text-[#1B1B26]">{`"Engineered RESTful APIs using FastAPI, demonstrating end-to-end ML deployment proficiency."`}</div>
                </div>
                {optimized && (
                  <div className="mt-6">
                    <p className="text-xs font-bold text-[#13075B] uppercase mb-2">Why this is better</p>
                    <ul className="text-xs text-[#474551] list-disc pl-4 space-y-1">
                      <li>Stronger action verbs (Built, Engineered)</li>
                      <li>Measurable outcome (18% improvement)</li>
                      <li>Technical specificity (FastAPI, regression)</li>
                      <li>ATS-compatible keywords</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {!analyzed && (
            <div className="lg:col-span-8">
              <EmptyState icon="📄" title="Resume not yet analyzed" description="Paste your resume text on the left, select a target role, then click Analyze Resume." />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VOICE INTERVIEW
═══════════════════════════════════════════════════════════════ */
function VoiceInterviewPage({ path, profile, persistProfile, onBack }: {
  path: CareerPath; profile: UserProfile; persistProfile: (p: UserProfile) => void; onBack: () => void;
}) {
  const [step, setStep] = useState(0); // 0:setup 1:question 2:evaluating 3:report
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const QUESTIONS = [
    `Explain how backpropagation works and why it matters for training neural networks.`,
    `Describe a time you had to clean a messy dataset. What was your approach?`,
    `What is the difference between supervised and unsupervised learning? Give a practical example of each.`,
  ];

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const startInterview = () => { setStep(1); speak(QUESTIONS[0]); };

  const submitAnswer = () => {
    window.speechSynthesis?.cancel();
    setStep(2);
    setTimeout(() => {
      if (qIndex < QUESTIONS.length - 1) {
        setQIndex(qIndex + 1); setAnswer(""); setStep(1);
        speak(QUESTIONS[qIndex + 1]);
      } else {
        persistProfile({ ...profile, interviewScore: 82 });
        setStep(3);
      }
    }, 2000);
  };

  const endSession = () => { window.speechSynthesis?.cancel(); onBack(); };

  return (
    <div className="flex flex-col flex-1 bg-[#1B1B26] text-white min-h-screen">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 h-20 bg-[#1B1B26]/90 backdrop-blur-xl border-b border-white/10">
        <Logo />
        <GhostBtn onClick={endSession} className="!text-white !bg-white/10 !border-white/20 hover:!bg-white/20">End Session</GhostBtn>
      </nav>
      <main className="flex-1 flex flex-col max-w-[900px] mx-auto w-full px-6 py-12">
        {step === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-up">
            <div className="w-24 h-24 rounded-full bg-[#2F05EA]/20 border border-[#2F05EA]/40 flex items-center justify-center mb-8 text-4xl">🎙</div>
            <h2 className="text-4xl font-black mb-4">AI Voice Interviewer</h2>
            <p className="text-white/60 max-w-lg mb-12 text-lg leading-relaxed">
              CareerX will conduct a multi-question mock interview for the {path.title} role. Questions will be spoken aloud. Answer in the text field.
            </p>
            <PrimaryBtn onClick={startInterview} size="lg" className="!bg-[#2F05EA] hover:!bg-[#4B3BFF]">Start Interview Session</PrimaryBtn>
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 flex flex-col animate-fade-up">
            <p className="text-sm font-bold text-[#2F05EA] uppercase tracking-widest mb-4">Question {qIndex + 1} of {QUESTIONS.length}</p>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] mb-8 relative overflow-hidden">
              {speaking && <div className="absolute top-0 left-0 w-full h-1 bg-[#2F05EA] animate-pulse" />}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#2F05EA] flex items-center justify-center font-bold text-sm">AI</div>
                <span className="font-bold text-sm">{speaking ? "Speaking..." : "Interviewer"}</span>
              </div>
              <p className="text-xl leading-relaxed">{QUESTIONS[qIndex]}</p>
            </div>
            <textarea value={answer} onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full min-h-[140px] p-6 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-[#2F05EA] outline-none resize-none mb-6" />
            <PrimaryBtn onClick={submitAnswer} disabled={!answer.trim()} className="self-end !bg-[#2F05EA] hover:!bg-[#4B3BFF]">
              Submit Answer
            </PrimaryBtn>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex items-center justify-center">
            <Spinner label="Evaluating Response..." />
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col animate-fade-up">
            <h2 className="text-4xl font-black mb-8 text-center">Interview Report</h2>
            <div className="grid grid-cols-4 gap-4 mb-10">
              {[["Overall", 82, "text-[#2F05EA]"], ["Technical", 86, "text-white"], ["Comm.", 78, "text-white"], ["Structure", 79, "text-white"]].map(([label, score, color]) => (
                <div key={String(label)} className="bg-white/5 p-5 rounded-2xl text-center">
                  <p className="text-xs text-white/50 uppercase mb-1">{label}</p>
                  <p className={`text-3xl font-black ${color}`}>{score}%</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-3xl">
                <h4 className="font-bold text-emerald-400 mb-4">✓ What You Did Well</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>Clear explanation of core concepts</li>
                  <li>Good technical terminology</li>
                  <li>Structured responses</li>
                </ul>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-3xl">
                <h4 className="font-bold text-amber-400 mb-4">⚠ Improve</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>Use STAR method for behavioral questions</li>
                  <li>Add specific metrics and outcomes</li>
                </ul>
              </div>
            </div>
            <div className="text-center">
              <PrimaryBtn onClick={onBack} className="!bg-white !text-[#1B1B26] hover:!bg-white/90">Return to Dashboard</PrimaryBtn>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COPILOT WIDGET
═══════════════════════════════════════════════════════════════ */
type CopilotMsg = { role: "ai" | "user"; content: string | React.ReactNode };

function CopilotWidget({ path, profile, currentPage, navigate }: {
  path: CareerPath; profile: UserProfile; currentPage: string; navigate: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<CopilotMsg[]>([
    { role: "ai", content: copilotGreeting(profile, path, currentPage) }
  ]);
  const prevPage = useRef(currentPage);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (prevPage.current !== currentPage) {
      prevPage.current = currentPage;
      setMessages([{ role: "ai", content: copilotGreeting(profile, path, currentPage) }]);
    }
  }, [currentPage, profile, path]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const response = copilotRespond(text, profile, path, currentPage, navigate);
      setMessages(prev => [...prev, { role: "ai", content: response }]);
    }, 900);
  };

  const quickPrompts = getQuickPrompts(profile, currentPage);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="animate-fade-up bg-white w-80 lg:w-[380px] h-[560px] rounded-[2rem] shadow-2xl border border-[#787682]/20 mb-4 flex flex-col overflow-hidden">
          <div className="bg-[#13075B] p-5 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2F05EA] flex items-center justify-center font-bold text-xs">CX</div>
              <div>
                <h4 className="font-bold leading-none text-sm">CareerX Copilot</h4>
                <p className="text-xs text-indigo-200 mt-0.5">Your guide through CareerX</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-indigo-200 hover:text-white" aria-label="Close">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#FCF8FF]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#EFECFC] text-[#13075B] rounded-br-sm font-medium"
                    : "bg-white text-[#474551] border border-[#787682]/10 rounded-bl-sm shadow-sm"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#787682]/10 p-3.5 rounded-2xl rounded-bl-sm flex gap-1 shadow-sm">
                  {[0, 1, 2].map(i => <div key={i} className={`w-2 h-2 rounded-full bg-[#2F05EA]/50 animate-bounce delay-${i * 100}`} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {quickPrompts.length > 0 && (
            <div className="px-4 py-2 bg-white border-t border-[#787682]/10 flex flex-wrap gap-2 flex-shrink-0">
              {quickPrompts.slice(0, 3).map(p => (
                <button key={p} onClick={() => send(p)}
                  className="px-3 py-1 bg-[#EFECFC] text-[#13075B] text-xs font-bold rounded-full hover:bg-[#EAE8FD] border border-[#2F05EA]/10 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); send(input); }}
            className="p-4 bg-white border-t border-[#787682]/10 flex gap-2 flex-shrink-0">
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask CareerX anything..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#FCF8FF] border border-[#787682]/20 outline-none focus:border-[#2F05EA] text-sm text-[#1B1B26]" />
            <button type="submit" disabled={!input.trim() || typing}
              className="px-4 py-2.5 bg-[#2F05EA] text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-[#4B3BFF] transition-colors"
              aria-label="Send">↑</button>
          </form>
        </div>
      )}

      <button onClick={() => setOpen(!open)}
        className="w-16 h-16 rounded-full bg-[#13075B] text-white shadow-[0_8px_30px_rgba(19,7,91,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(47,5,234,0.4)] transition-all flex items-center justify-center relative"
        aria-label="Open CareerX Copilot">
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {!open && <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />}
      </button>
    </div>
  );
}

function copilotGreeting(profile: UserProfile, path: CareerPath, page: string): string {
  const name = profile.name ? `, ${profile.name}` : "";
  if (page === "results")  return `Hi${name}! You have 3 career trajectories. Click any path to explore the deep analysis, or ask me anything about your options.`;
  if (page === "detail")   return `You are exploring ${path.title}. Your readiness is estimated at ${profile.readiness}%. Ask me about your gaps, what to learn next, or what to do right now.`;
  if (page === "learning") return `You are in the learning workspace. Ask me to explain any concept, what to study next, or why this skill matters for ${path.title}.`;
  if (page === "project")  return `You are working on a project — one of the highest-impact things you can do. Ask me for guidance on any milestone or task.`;
  if (page === "resume")   return `You are in Resume Studio. Paste your resume, pick a target role, then ask me what to change or why your score is where it is.`;
  if (page === "interview") return `You are preparing for an interview. Ask me what ${path.title} interviewers typically look for, or how to improve your answers.`;
  return `Hi${name}! Ask me anything about CareerX, your career path, or what to do next.`;
}

function getQuickPrompts(profile: UserProfile, page: string): string[] {
  if (page === "results")  return ["Which path fits me best?", "Explain my options", "What should I focus on?"];
  if (page === "detail")   return ["What should I learn first?", "Show my skill gaps", "Help with my resume"];
  if (page === "learning") return ["Explain this concept", "What comes next?", "Why does this matter?"];
  if (page === "project")  return ["Help with this milestone", "Why is this project important?", "What skills do I gain?"];
  if (page === "resume")   return ["Why is my score low?", "What keywords am I missing?", "Help me write a stronger bullet"];
  if (profile.readiness < 60) return ["Why is my readiness low?", "What should I do first?", "How does CareerX work?"];
  return ["What should I do next?", "Explain my baseline", "How can I improve?"];
}

function copilotRespond(
  text: string, profile: UserProfile, path: CareerPath, page: string, navigate: (s: string) => void
): React.ReactNode {
  const lower = text.toLowerCase();
  const topGap = path.skillGaps[0]?.skill || "System Design";
  const readiness = profile.readiness;

  if (lower.includes("resume") || lower.includes("cv")) {
    return (
      <div>
        <p className="mb-3">Opening Resume Studio now.</p>
        <button onClick={() => navigate("resume")} className="w-full py-2 bg-[#13075B] text-white rounded-lg font-bold text-sm hover:bg-[#2F05EA]">Open Resume Studio →</button>
      </div>
    );
  }
  if (lower.includes("interview") || lower.includes("practice")) {
    return (
      <div>
        <p className="mb-3">{`Your readiness is ${readiness}% — a good time to start practicing.`}</p>
        <button onClick={() => navigate("interview")} className="w-full py-2 bg-[#13075B] text-white rounded-lg font-bold text-sm hover:bg-[#2F05EA]">Start AI Interview →</button>
      </div>
    );
  }
  if (lower.includes("learn") || lower.includes("study") || lower.includes("focus") || lower.includes("what should i")) {
    return (
      <div>
        <p className="mb-2">{`Your highest-value next step is learning ${topGap}.`}</p>
        <p className="mb-3 text-xs text-[#787682]">{`This skill appears in most ${path.title} job listings and is your biggest current gap.`}</p>
        <button onClick={() => navigate("learning")} className="w-full py-2 bg-[#EFECFC] text-[#2F05EA] rounded-lg font-bold text-sm hover:bg-[#EAE8FD]">Open Learning Track →</button>
      </div>
    );
  }
  if (lower.includes("project")) {
    return (
      <div>
        <p className="mb-3">{`Your recommended project closes the gap between theory and production for ${path.title}.`}</p>
        <button onClick={() => navigate("project")} className="w-full py-2 bg-[#EFECFC] text-[#2F05EA] rounded-lg font-bold text-sm">View Project →</button>
      </div>
    );
  }
  if (lower.includes("baseline") || lower.includes("score") || lower.includes("readiness") || lower.includes("why")) {
    return <p>{`Your career readiness is estimated at ${readiness}%. Your lowest dimension is production readiness — that is why CareerX recommends building a deployable project. Your ${topGap} gap is the key thing holding you back.`}</p>;
  }
  if (lower.includes("next") || lower.includes("do now") || lower.includes("do today")) {
    const nextStep = readiness < 60 ? `Start the ${topGap} learning module` : readiness < 80 ? "Complete your recommended project" : "Practice the interview and optimize your resume";
    return (
      <div>
        <p className="mb-3">{`Based on your ${readiness}% readiness: ${nextStep}.`}</p>
        <button onClick={() => navigate("learning")} className="w-full py-2 bg-[#EFECFC] text-[#2F05EA] rounded-lg font-bold text-sm">Continue Learning →</button>
      </div>
    );
  }
  if (lower.includes("how does careerx") || lower.includes("explain careerx") || lower.includes("how does this work")) {
    return <p>{"CareerX works in 6 stages: Profile → Analysis → Baseline → Trajectories → Learning → Projects. Each stage uses your real profile data to personalize the output. Every action you complete updates your readiness score."}</p>;
  }

  const pageContexts: Record<string, string> = {
    detail:    `You are in the deep analysis for ${path.title}. Readiness: ${readiness}%. Biggest gap: ${topGap}. Ask me what to do, what to learn, or why your score is what it is.`,
    learning:  `Your learning track covers ${topGap} and related skills needed for ${path.title} roles.`,
    resume:    `Your resume currently needs stronger action verbs and measurable project outcomes. Apply Smart Improvements to see the difference.`,
    interview: `For ${path.title} roles, expect questions on ${topGap}, system design, and behavioral scenarios. Use STAR format for behavioral questions.`,
  };

  return <p>{pageContexts[page] || `Ask me anything specific — "what should I learn?", "explain my gaps", "take me to my resume", or "what should I do today?"`}</p>;
}
