"use client";

import { useState, useEffect } from "react";
import type { SimulationResult, CareerPath, SkillGap } from "@/lib/schema";

/* ═══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
type AppState = "landing" | "profile" | "loading" | "results" | "detail";

/* ═══════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [state, setState] = useState<AppState>("landing");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");
  const [lastPayload, setLastPayload] = useState<{
    year: number;
    skills: string[];
    interests: string[];
  } | null>(null);

  async function handleSimulate(payload: {
    year: number;
    skills: string[];
    interests: string[];
  }) {
    setLastPayload(payload);
    setError(null);
    setState("loading");
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSource(res.headers.get("x-careerx-source") ?? "");
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Something went wrong. Please try again.");
        setState("profile");
        return;
      }
      setResult(data);
      setState("results");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setState("profile");
    }
  }

  function handleWhatIf(newSkill: string) {
    if (!lastPayload) return;
    const updatedSkills = lastPayload.skills.includes(newSkill)
      ? lastPayload.skills
      : [...lastPayload.skills, newSkill];
    handleSimulate({ ...lastPayload, skills: updatedSkills });
  }

  return (
    <>
      <div className="bg-ambient" aria-hidden="true" />
      <div className="relative z-10 min-h-screen flex flex-col">
        {state === "landing" && (
          <LandingPage onStart={() => setState("profile")} onTryExample={() => setState("profile")} />
        )}
        {state === "profile" && (
          <ProfilePage onSubmit={handleSimulate} error={error} onClearError={() => setError(null)} />
        )}
        {state === "loading" && <LoadingPage />}
        {state === "results" && result && (
          <ResultsPage
            result={result}
            source={source}
            onSelectPath={(p) => {
              setSelectedPath(p);
              setState("detail");
            }}
            onRerun={() => setState("profile")}
          />
        )}
        {state === "detail" && selectedPath && (
          <DetailPage path={selectedPath} onBack={() => setState("results")} onWhatIf={handleWhatIf} />
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHARED UI ATOMS & ICONS (LIGHT THEME)
══════════════════════════════════════════════════════════════════ */
function Logo() {
  return (
    <span className="font-black text-2xl tracking-tighter text-[#13075B]">
      Career<span className="text-[#2F05EA]">X</span>
    </span>
  );
}

function NavBar({ right }: { right?: React.ReactNode }) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 h-20 bg-[#FCF8FF]/80 backdrop-blur-2xl border-b border-[#787682]/10">
      <Logo />
      <div>{right}</div>
    </nav>
  );
}

function PrimaryButton({ children, onClick, disabled, type = "button", className = "" }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, type?: "button"|"submit", className?: string }) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all duration-300 ${disabled ? 'opacity-40 cursor-not-allowed bg-[#787682]' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl bg-[#13075B] hover:bg-[#2F05EA] shadow-md'} ${className}`}
      style={{ letterSpacing: "-0.01em" }}
    >
      {children}
    </button>
  );
}

function RadialGauge({ score, size = 96, stroke = 8, color = "#2F05EA", delay = 0 }: { score: number, size?: number, stroke?: number, color?: string, delay?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circ - (score / 100) * circ);
    }, delay);
    return () => clearTimeout(t);
  }, [score, circ, delay]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EFECFC" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-[1500ms] cubic-bezier(0.16, 1, 0.3, 1)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-black leading-none text-[#1B1B26] tracking-tighter" style={{ fontSize: `${size * 0.28}px` }}>{score}</span>
        <span className="font-bold text-[#787682] uppercase tracking-widest mt-0.5" style={{ fontSize: `${size * 0.1}px` }}>Fit</span>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold tracking-[0.15em] text-[#13075B] uppercase mb-6 opacity-80">
      {children}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING & PROFILE & LOADING
══════════════════════════════════════════════════════════════════ */
function LandingPage({ onStart, onTryExample }: { onStart: ()=>void, onTryExample: ()=>void }) {
  return (
    <div className="flex flex-col flex-1">
      <NavBar />
      <main className="flex-1 flex flex-col items-center justify-center px-6 lg:px-16 text-center w-full max-w-[1600px] mx-auto min-h-[calc(100vh-80px)] py-12">
        <h1 className="animate-fade-up text-5xl md:text-7xl lg:text-[7rem] font-black tracking-tighter leading-[1.05] mb-8 text-[#1B1B26]">
          Three Futures.<br/>
          <span className="text-[#2F05EA]">One You.</span>
        </h1>
        <p className="animate-fade-up delay-100 max-w-3xl text-lg lg:text-2xl leading-relaxed text-[#474551] mb-12">
          Tell us where you are today. We reveal three realistic career trajectories mapping exactly how you evolve from student to professional.
        </p>
        <div className="animate-fade-up delay-200 flex flex-wrap gap-6 justify-center">
          <PrimaryButton onClick={onStart} className="text-lg px-10 py-5">Explore My Futures →</PrimaryButton>
          <button
            onClick={onTryExample}
            className="px-10 py-5 rounded-xl border border-[#787682]/30 bg-white text-[#1B1B26] font-bold hover:bg-[#EFECFC] hover:border-[#13075B]/30 transition-all text-lg shadow-sm"
          >
            Try Demo Persona
          </button>
        </div>
      </main>
    </div>
  );
}

const DEMO = { year: 1, skills: ["Python", "C++", "HTML"], interests: ["AI", "Web Development"] };

function ProfilePage({ onSubmit, error, onClearError }: { onSubmit: (p: {year:number,skills:string[],interests:string[]})=>void, error: string|null, onClearError: ()=>void }) {
  const [year, setYear] = useState(1);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const loadDemo = () => { setYear(DEMO.year); setSkills([...DEMO.skills]); setInterests([...DEMO.interests]); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onClearError(); if (skills.length && interests.length) onSubmit({ year, skills, interests }); };

  return (
    <div className="flex flex-col flex-1">
      <NavBar right={<button type="button" onClick={loadDemo} className="text-xs font-bold text-[#2F05EA] bg-[#EFECFC] border border-[#2F05EA]/20 rounded-lg px-4 py-2 hover:bg-[#E0DAF9] transition-all">Load Demo ✦</button>} />
      <main className="flex-1 flex justify-center items-center p-6 lg:p-12 w-full max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-4xl glass p-8 lg:p-16 rounded-[2rem]">
          <div className="animate-fade-up mb-10 text-center">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-[#1B1B26]">Current Profile</h2>
            <p className="text-[#474551] mt-4 text-lg">Initialize your career intelligence simulation</p>
          </div>
          {error && <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">⚠ {error}</div>}
          
          <form onSubmit={handleSubmit} className="animate-fade-up delay-100 flex flex-col gap-10">
            <div>
              <label className="block text-sm font-bold text-[#787682] uppercase tracking-widest mb-4">Year of Study</label>
              <div className="grid grid-cols-4 gap-4 lg:gap-6">
                {[1, 2, 3, 4].map(y => (
                  <button key={y} type="button" onClick={() => setYear(y)} 
                    className={`py-4 lg:py-6 rounded-2xl text-lg font-bold transition-all ${y === year ? 'border-2 border-[#13075B] bg-[#EFECFC] text-[#13075B] shadow-md' : 'border border-[#787682]/20 bg-white text-[#474551] hover:bg-[#FCF8FF]'}`}>
                    Year {y}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <MiniTagInput label="Skills" tags={skills} setTags={setSkills} placeholder="e.g. Python, React..." />
               <MiniTagInput label="Interests" tags={interests} setTags={setInterests} placeholder="e.g. AI, Design..." />
            </div>
            <div className="flex justify-center mt-4">
              <PrimaryButton type="submit" disabled={!skills.length || !interests.length} className="w-full lg:w-auto px-16 py-5 text-lg">
                Initialize Simulation →
              </PrimaryButton>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function MiniTagInput({ label, tags, setTags, placeholder }: { label: string, tags: string[], setTags: (t:string[])=>void, placeholder: string }) {
  const [val, setVal] = useState("");
  const add = () => { const t = val.trim(); if (t && !tags.includes(t)) setTags([...tags, t]); setVal(""); };
  return (
    <div>
      <label className="block text-sm font-bold text-[#787682] uppercase tracking-widest mb-4">{label}</label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((t, i) => (
             <span key={i} className="text-sm px-3 py-1.5 rounded-full bg-[#EFECFC] border border-[#29236F]/10 flex gap-2 items-center text-[#13075B] font-medium">
               {t} <button type="button" onClick={() => setTags(tags.filter((_,idx)=>idx!==i))} className="text-[#13075B]/60 hover:text-[#13075B]">×</button>
             </span>
          ))}
        </div>
      )}
      <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} 
        placeholder={placeholder} 
        className="w-full px-5 py-4 rounded-xl border border-[#787682]/30 bg-white text-[#1B1B26] outline-none focus:border-[#2F05EA] focus:ring-4 focus:ring-[#2F05EA]/10 transition-all text-lg shadow-sm" />
    </div>
  );
}

function LoadingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="relative w-32 h-32">
         <div className="spin absolute inset-0 rounded-full border-4 border-transparent border-t-[#2F05EA]" />
         <div className="spin-rev absolute inset-4 rounded-full border-4 border-transparent border-t-[#001F1A] opacity-50" />
         <div className="glow-pulse absolute inset-10 rounded-full bg-[#2F05EA]/10 blur-xl" />
      </div>
      <p className="animate-fade-up delay-200 mt-10 text-[#13075B] tracking-[0.2em] uppercase font-bold text-sm">
        Computing Trajectories...
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESULTS: EXPANSIVE DESKTOP VISUALIZATION
══════════════════════════════════════════════════════════════════ */
const ACCENTS = [
  { from: "#13075B", to: "#2F05EA", bg: "#EFECFC" }, 
  { from: "#2F05EA", to: "#4B3BFF", bg: "#EAE8FD" },
  { from: "#001F1A", to: "#13075B", bg: "#E6EFEE" }
];

function ResultsPage({ result, source, onSelectPath, onRerun }: { result: SimulationResult, source: string, onSelectPath: (p: CareerPath)=>void, onRerun: ()=>void }) {
  const sorted = [...result.paths].sort((a, b) => b.fitScore - a.fitScore);

  return (
    <div className="flex flex-col flex-1 overflow-x-hidden">
      <NavBar right={<button onClick={onRerun} className="text-sm font-bold text-[#474551] bg-white border border-[#787682]/20 px-4 py-2 rounded-lg hover:bg-[#EFECFC] transition-colors shadow-sm">← Refine Profile</button>} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-16 py-12 lg:py-20 flex flex-col">
        {/* Header */}
        <div className="animate-fade-up mb-8 z-10 text-center lg:text-left">
          <p className="text-xs font-bold tracking-[0.15em] text-[#13075B] uppercase mb-3 opacity-80">Career Intelligence Visualization</p>
          <h2 className="text-4xl lg:text-6xl font-black tracking-tight text-[#1B1B26]">Three Discovered Trajectories</h2>
        </div>

        {/* --- EXPANSIVE TRAJECTORY GRAPH --- */}
        <div className="relative w-full flex flex-col lg:flex-row items-center justify-between min-h-[600px] lg:min-h-[700px] mt-4 lg:mt-12 gap-16 lg:gap-0">
          
          {/* SVG Background Lines */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Desktop SVG */}
            <svg className="hidden lg:block w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 1000">
              <defs>
                <linearGradient id="g0" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={ACCENTS[0].from} stopOpacity="0.1" /><stop offset="100%" stopColor={ACCENTS[0].from} stopOpacity="0.8" /></linearGradient>
                <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={ACCENTS[1].from} stopOpacity="0.1" /><stop offset="100%" stopColor={ACCENTS[1].from} stopOpacity="0.8" /></linearGradient>
                <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={ACCENTS[2].from} stopOpacity="0.1" /><stop offset="100%" stopColor={ACCENTS[2].from} stopOpacity="0.8" /></linearGradient>
              </defs>
              <path d="M 150 500 C 450 500, 550 166, 850 166" fill="none" stroke="url(#g0)" strokeWidth="3" className="svg-trajectory-line delay-300" />
              <path d="M 150 500 L 850 500" fill="none" stroke="url(#g1)" strokeWidth="3" className="svg-trajectory-line delay-400" />
              <path d="M 150 500 C 450 500, 550 833, 850 833" fill="none" stroke="url(#g2)" strokeWidth="3" className="svg-trajectory-line delay-500" />
            </svg>
            
            {/* Mobile SVG */}
            <svg className="block lg:hidden w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 1000">
              <defs>
                <linearGradient id="gm" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#13075B" stopOpacity="0.5" /><stop offset="100%" stopColor="#13075B" stopOpacity="0.05" /></linearGradient>
              </defs>
              <path d="M 500 50 L 500 950" fill="none" stroke="url(#gm)" strokeWidth="3" className="svg-trajectory-line delay-300" />
            </svg>
          </div>

          {/* Left Node: Current Profile */}
          <div className="lg:w-[25%] flex justify-center z-10 w-full animate-fade-up delay-200">
            <div className="bg-white p-8 rounded-full flex flex-col items-center justify-center border-4 border-[#EFECFC] shadow-[0_8px_32px_rgba(19,7,91,0.08)] aspect-square w-56 lg:w-64">
              <div className="glow-pulse w-5 h-5 bg-[#2F05EA] rounded-full mb-4 shadow-[0_0_12px_rgba(47,5,234,0.4)]" />
              <span className="text-sm font-black tracking-[0.2em] text-[#13075B] uppercase text-center leading-relaxed">Current<br/>Profile</span>
            </div>
          </div>

          {/* Right Nodes: 3 Career Cards */}
          <div className="lg:w-[35%] flex flex-col justify-between z-10 w-full h-full gap-8 lg:gap-12 py-4 lg:py-0">
            {sorted.map((path, idx) => (
              <VisualCareerCard key={path.title} path={path} accent={ACCENTS[idx]} delay={600 + idx * 200} onClick={() => onSelectPath(path)} />
            ))}
          </div>
        </div>

        {/* --- COMPARISON BARS --- */}
        <div className="animate-fade-up delay-1200 mt-24 glass p-8 lg:p-12 rounded-3xl w-full max-w-5xl mx-auto">
          <SectionLabel>Trajectory Comparison</SectionLabel>
          <div className="flex flex-col gap-8 mt-6">
            {sorted.map((path, idx) => (
              <div key={path.title} className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
                <span className="text-lg font-bold text-[#1B1B26] lg:w-64 flex-shrink-0 lg:text-right">{path.title}</span>
                <div className="flex-1 h-4 bg-[#EFECFC] rounded-full overflow-hidden relative shadow-inner">
                  <div
                    className="bar-animate absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${path.fitScore}%`,
                      background: `linear-gradient(90deg, ${ACCENTS[idx].from}, ${ACCENTS[idx].to})`,
                      animationDelay: `${1200 + idx*150}ms`
                    }}
                  />
                </div>
                <span className="text-2xl font-black lg:w-20" style={{ color: ACCENTS[idx].from }}>{path.fitScore}%</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function VisualCareerCard({ path, accent, delay, onClick }: { path: CareerPath, accent: {from:string,to:string,bg:string}, delay: number, onClick: ()=>void }) {
  return (
    <div
      className="animate-fade-up card-hover glass w-full rounded-[2rem] p-6 lg:p-8 flex items-center gap-6 lg:gap-8 cursor-pointer relative overflow-hidden group"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="absolute top-0 left-0 w-2 h-full transition-all duration-300 opacity-20 group-hover:opacity-100 group-hover:w-3" style={{ background: accent.from }} />
      
      <RadialGauge score={path.fitScore} color={accent.from} delay={delay + 200} size={100} stroke={8} />
      
      <div className="flex-1 min-w-0">
        <h3 className="text-xl lg:text-2xl font-black text-[#1B1B26] mb-3 truncate">{path.title}</h3>
        {/* Minimal skill gap viz */}
        <div className="flex flex-col gap-2">
          {path.skillGaps.slice(0,2).map((sg: SkillGap) => (
            <div key={sg.skill} className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-[#787682] truncate">{sg.skill}</span>
              <div className="flex gap-1 flex-shrink-0">
                {[1,2,3,4,5].map(lvl => (
                  <div key={lvl} className="w-3 h-1.5 rounded-sm" 
                    style={{ background: lvl <= sg.currentLevel ? accent.from : lvl <= sg.targetLevel ? accent.bg : "#F3F1F8" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center bg-[#EFECFC] text-[#2F05EA] group-hover:bg-[#2F05EA] group-hover:text-white transition-colors">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL PAGE: FULL SCREEN DASHBOARD GRID
══════════════════════════════════════════════════════════════════ */
function DetailPage({ path, onBack, onWhatIf }: { path: CareerPath, onBack: ()=>void, onWhatIf: (skill:string)=>void }) {
  const [whatIfVal, setWhatIfVal] = useState("");
  const submitWhatIf = (e: React.FormEvent) => { e.preventDefault(); if(whatIfVal.trim()) onWhatIf(whatIfVal.trim()); }

  return (
    <div className="flex flex-col flex-1 overflow-x-hidden">
      <NavBar right={<button onClick={onBack} className="text-sm font-bold text-[#474551] bg-white border border-[#787682]/20 px-4 py-2 rounded-lg hover:bg-[#EFECFC] transition-colors shadow-sm">← Trajectories</button>} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-16 py-12 lg:py-16">
        
        {/* Hero Section */}
        <div className="animate-fade-up flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12 mb-12">
          <RadialGauge score={path.fitScore} size={160} stroke={12} color="#13075B" />
          <div className="flex-1">
            <p className="text-xs font-bold tracking-[0.2em] text-[#2F05EA] uppercase mb-4">Trajectory Analysis</p>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight text-[#1B1B26] mb-6 leading-tight">{path.title}</h2>
            <p className="text-lg lg:text-xl text-[#474551] max-w-4xl leading-relaxed">{path.summary}</p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Skills Map */}
          <div className="lg:col-span-7 glass p-8 lg:p-12 rounded-[2rem] animate-fade-up delay-100">
            <SectionLabel>Skill Visualization</SectionLabel>
            <SkillMap path={path} />
          </div>

          {/* Fit Reasoning & What If */}
          <div className="lg:col-span-5 flex flex-col gap-8 lg:gap-10 animate-fade-up delay-200">
             <div className="glass p-8 lg:p-12 rounded-[2rem] flex-1">
                <SectionLabel>Fit Analysis</SectionLabel>
                <p className="text-[#474551] leading-relaxed text-lg mb-8">{path.fitReason}</p>
                <div className="p-6 rounded-2xl bg-[#EFECFC] border border-[#29236F]/10">
                   <span className="text-xs font-bold text-[#13075B] uppercase tracking-widest block mb-3 opacity-80">Why it fits you</span>
                   <p className="text-[#29236F] leading-relaxed text-sm lg:text-base font-medium">{path.whyItFits}</p>
                </div>
             </div>
             
             {/* What If Interactive Widget */}
             <div className="glass p-8 lg:p-10 rounded-[2rem] bg-white border border-[#2F05EA]/20 shadow-[0_8px_30px_rgba(47,5,234,0.06)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#EFECFC] rounded-bl-full opacity-50 pointer-events-none" />
                <h3 className="text-xl font-bold text-[#1B1B26] mb-2 relative z-10">What if I learn...?</h3>
                <p className="text-sm text-[#787682] mb-6 relative z-10">Add a skill to instantly recalculate your trajectories.</p>
                <form onSubmit={submitWhatIf} className="flex gap-4 relative z-10">
                  <input value={whatIfVal} onChange={e=>setWhatIfVal(e.target.value)} placeholder="e.g. Docker" className="flex-1 px-5 py-4 rounded-xl bg-white border border-[#787682]/30 text-[#1B1B26] outline-none focus:border-[#2F05EA] focus:ring-4 focus:ring-[#2F05EA]/10 transition-all shadow-sm" />
                  <PrimaryButton type="submit" disabled={!whatIfVal.trim()} className="px-6 py-4 rounded-xl shadow-md">Regenerate</PrimaryButton>
                </form>
             </div>
          </div>

          {/* Year Trajectory (Horizontal on Desktop) */}
          <div className="lg:col-span-12 glass p-8 lg:p-12 rounded-[2rem] animate-fade-up delay-300 overflow-hidden">
            <SectionLabel>Year-by-Year Roadmap</SectionLabel>
            <VisualTrajectory path={path} />
          </div>

          {/* First 30 Days */}
          <div className="lg:col-span-12 glass p-8 lg:p-12 rounded-[2rem] animate-fade-up delay-400 overflow-hidden bg-gradient-to-b from-white to-[#FCF8FF]">
            <SectionLabel>First 30 Days Action Plan</SectionLabel>
            <Timeline30Days path={path} />
          </div>

          {/* Projects */}
          <div className="lg:col-span-12 glass p-8 lg:p-12 rounded-[2rem] animate-fade-up delay-500">
            <SectionLabel>Recommended Projects</SectionLabel>
            <VisualProjects path={path} />
          </div>

        </div>
      </main>
    </div>
  );
}

/* ── 1. Skill Map (Visual Blocks) ───────────────────────────── */
function SkillMap({ path }: { path: CareerPath }) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {path.skillGaps.map((sg, i) => (
        <div key={sg.skill} className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 p-6 rounded-2xl bg-[#FCF8FF] border border-[#787682]/10">
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-bold text-[#1B1B26] mb-2 truncate">{sg.skill}</h4>
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${sg.importance === "high" ? 'bg-red-50 text-red-600 border border-red-100' : sg.importance === "medium" ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              {sg.importance} Priority
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              {[1,2,3,4,5].map(lvl => (
                <div
                  key={lvl}
                  className={`w-8 lg:w-12 h-3 rounded-sm transition-all duration-500 ${
                    lvl <= sg.currentLevel ? "bg-[#13075B] shadow-sm" 
                    : lvl <= sg.targetLevel ? "bg-[#EFECFC] border border-[#2F05EA]/30 border-dashed" 
                    : "bg-[#F3F1F8]"
                  }`}
                />
              ))}
            </div>
            <div className="w-12 text-right text-xl font-black text-[#13075B]">{sg.targetLevel}/5</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 2. Visual Trajectory (Horizontal on Desktop) ────────────── */
function VisualTrajectory({ path }: { path: CareerPath }) {
  return (
    <div className="relative pt-4 w-full">
      {/* Track Lines */}
      <div className="hidden lg:block absolute top-[28px] left-8 right-8 h-1 bg-[#EFECFC] rounded-full overflow-hidden">
         <div className="w-full h-full bg-gradient-to-r from-[#2F05EA] to-transparent opacity-20" />
      </div>
      <div className="block lg:hidden absolute top-8 bottom-0 left-[28px] w-1 bg-[#EFECFC] rounded-full overflow-hidden">
         <div className="w-full h-full bg-gradient-to-b from-[#2F05EA] to-transparent opacity-20" />
      </div>
      
      <div className="flex flex-col lg:flex-row w-full gap-12 lg:gap-8 relative z-10">
        {path.milestones.map((m, i) => (
          <div key={i} className="flex-1 relative pl-16 lg:pl-0 lg:pt-16 group">
            {/* Node */}
            <div className="absolute left-[20px] top-[4px] lg:left-8 lg:top-[20px] w-5 h-5 rounded-full bg-[#2F05EA] shadow-[0_0_12px_rgba(47,5,234,0.4)] border-4 border-white transition-transform group-hover:scale-125" />
            
            <h4 className="text-xl font-black text-[#13075B] uppercase tracking-widest mb-6 lg:px-6">{m.yearLabel}</h4>
            
            <div className="bg-[#FCF8FF] border border-[#787682]/10 p-6 lg:p-8 rounded-2xl h-full transition-colors group-hover:bg-[#EFECFC] group-hover:border-[#2F05EA]/20 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-6">
                {m.skillsToLearn.map(s => (
                  <span key={s} className="text-xs font-bold px-3 py-1.5 bg-white text-[#2F05EA] rounded-lg border border-[#2F05EA]/10 shadow-sm">{s}</span>
                ))}
              </div>
              <ul className="flex flex-col gap-4">
                {m.goals.map((g, j) => (
                  <li key={j} className="text-sm lg:text-base text-[#474551] flex items-start gap-3">
                    <span className="text-[#2F05EA] mt-1 text-lg leading-none">•</span> <span className="leading-relaxed">{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 3. Projects (Tech Cards Grid) ──────────────────────────── */
function VisualProjects({ path }: { path: CareerPath }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-6">
      {path.projects.map((proj, i) => (
        <div key={i} className="bg-white border border-[#787682]/15 p-8 rounded-2xl flex flex-col hover:-translate-y-1 hover:border-[#2F05EA]/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[#13075B]/5">
          <div className="flex justify-between items-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#EFECFC] flex items-center justify-center text-sm font-bold text-[#13075B]">0{i+1}</div>
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${proj.difficulty==="beginner" ? "bg-emerald-50 text-emerald-700" : proj.difficulty==="advanced" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
              {proj.weeks}w • {proj.difficulty}
            </span>
          </div>
          <h4 className="text-xl font-black text-[#1B1B26] mb-4 leading-tight">{proj.name}</h4>
          <p className="text-sm lg:text-base text-[#474551] leading-relaxed flex-1">{proj.description}</p>
          <div className="flex flex-wrap gap-2 mt-8">
            {proj.skillsPracticed.map(s => (
              <span key={s} className="text-xs font-medium px-3 py-1.5 bg-[#FCF8FF] text-[#474551] rounded-md border border-[#787682]/10">{s}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 4. First 30 Days (Horizontal Node Timeline) ────────────── */
function Timeline30Days({ path }: { path: CareerPath }) {
  const sorted = [...path.first30Days].sort((a,b) => a.week - b.week);
  
  return (
    <div className="w-full overflow-x-auto pb-4 pt-2">
      <div className="flex min-w-max">
        {sorted.map((w, i) => (
          <div key={w.week} className="w-[320px] lg:w-[400px] relative group">
            {/* Connecting Track */}
            <div className="absolute top-[10px] left-[24px] right-0 h-1 bg-[#EFECFC] group-hover:bg-[#2F05EA]/20 transition-colors" style={{ display: i === sorted.length-1 ? 'none' : 'block' }} />
            
            {/* Glowing Node */}
            <div className="absolute top-[2px] left-[20px] w-5 h-5 rounded-full bg-white border-4 border-[#EFECFC] group-hover:border-[#2F05EA] transition-all shadow-sm" />
            
            <div className="pt-10 pr-10 pl-[20px]">
              <h4 className="text-lg font-black text-[#13075B] mb-6 tracking-tight">Week {w.week}</h4>
              <ul className="flex flex-col gap-4">
                {w.tasks.map((task, j) => (
                  <li key={j} className="text-sm lg:text-base text-[#474551] leading-relaxed flex items-start gap-3">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#13075B]/20 flex-shrink-0 group-hover:bg-[#2F05EA] transition-colors" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
