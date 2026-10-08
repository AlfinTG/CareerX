"use client";

import { useState, useEffect, useRef } from "react";
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
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
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
            onSelectPath={(p: CareerPath) => {
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
   SHARED UI ATOMS & ICONS
══════════════════════════════════════════════════════════════════ */
function Logo() {
  return (
    <span
      style={{
        fontWeight: 900, fontSize: "1.35rem", letterSpacing: "-0.03em",
        background: "linear-gradient(135deg,#818cf8 0%,#a78bfa 55%,#67e8f9 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      }}
    >
      CareerX
    </span>
  );
}

function NavBar({ right }: { right?: React.ReactNode }) {
  return (
    <nav
      style={{
        position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 1.5rem", height: "64px",
        background: "rgba(3,5,10,0.6)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <Logo />
      <div>{right}</div>
    </nav>
  );
}

function PrimaryButton({ children, onClick, disabled, type = "button", style }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, type?: "button"|"submit", style?: React.CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        padding: "0.875rem 2rem", borderRadius: "0.75rem", border: "none",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        fontWeight: 600, fontSize: "1rem", color: "#fff",
        background: hovered && !disabled ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "linear-gradient(135deg,#6366f1,#7c3aed)",
        boxShadow: hovered && !disabled ? "0 0 24px rgba(99,102,241,0.5)" : "0 4px 16px rgba(99,102,241,0.2)",
        transform: hovered && !disabled ? "translateY(-1px)" : "none",
        transition: "all 200ms cubic-bezier(0.4,0,0.2,1)", letterSpacing: "-0.01em", ...style,
      }}
    >
      {children}
    </button>
  );
}

function RadialGauge({ score, size = 96, stroke = 8, color = "#8b5cf6", delay = 0 }: { score: number, size?: number, stroke?: number, color?: string, delay?: number }) {
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
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontSize: `${size * 0.28}px`, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", color: "#fff" }}>{score}</span>
        <span style={{ fontSize: `${size * 0.12}px`, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Fit</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING & PROFILE & LOADING (Unchanged logic, polished styling)
══════════════════════════════════════════════════════════════════ */
function LandingPage({ onStart, onTryExample }: { onStart: ()=>void, onTryExample: ()=>void }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1.5rem", textAlign: "center" }}>
        <h1 className="animate-fade-up" style={{ fontSize: "clamp(3rem,8vw,5.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "1.5rem" }}>
          <span className="gradient-text">Three Futures.</span> <span style={{ color: "#f1f5f9" }}>One You.</span>
        </h1>
        <p className="animate-fade-up delay-100" style={{ maxWidth: "520px", fontSize: "1.15rem", lineHeight: 1.7, color: "#94a3b8", marginBottom: "3rem" }}>
          Tell us where you are today. We reveal three realistic career trajectories mapping exactly how you evolve from student to professional.
        </p>
        <div className="animate-fade-up delay-200" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
          <PrimaryButton onClick={onStart}>Explore My Futures →</PrimaryButton>
          <button
            onClick={onTryExample}
            style={{ padding: "0.875rem 1.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#94a3b8", fontWeight: 600, cursor: "pointer", transition: "all 200ms" }}
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar right={<button type="button" onClick={loadDemo} style={{ fontSize: "0.78rem", fontWeight: 600, color: "#818cf8", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "0.5rem", padding: "0.35rem 0.85rem", cursor: "pointer" }}>Load Demo ✦</button>} />
      <main style={{ flex: 1, display: "flex", justifyContent: "center", padding: "3rem 1.5rem" }}>
        <div style={{ width: "100%", maxWidth: "520px" }}>
          <div className="animate-fade-up" style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Current Profile</h2>
          </div>
          {error && <div style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "0.75rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>⚠ {error}</div>}
          <form onSubmit={handleSubmit} className="animate-fade-up delay-100" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Year selector omitted for brevity but keeping functional layout */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
              {[1, 2, 3, 4].map(y => (
                <button key={y} type="button" onClick={() => setYear(y)} style={{ padding: "0.875rem", borderRadius: "0.75rem", border: y === year ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.07)", background: y === year ? "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.1))" : "rgba(255,255,255,0.02)", color: y === year ? "#c4b5fd" : "#64748b", fontWeight: 700, cursor: "pointer" }}>Y{y}</button>
              ))}
            </div>
            <MiniTagInput label="Skills" tags={skills} setTags={setSkills} />
            <MiniTagInput label="Interests" tags={interests} setTags={setInterests} />
            <PrimaryButton type="submit" disabled={!skills.length || !interests.length}>Initialize Simulation →</PrimaryButton>
          </form>
        </div>
      </main>
    </div>
  );
}

function MiniTagInput({ label, tags, setTags }: { label: string, tags: string[], setTags: (t:string[])=>void }) {
  const [val, setVal] = useState("");
  const add = () => { const t = val.trim(); if (t && !tags.includes(t)) setTags([...tags, t]); setVal(""); };
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>{label}</label>
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
          {tags.map((t: string, i: number) => (
             <span key={i} style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "0.4rem", alignItems: "center" }}>{t} <button type="button" onClick={() => setTags(tags.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",padding:0}}>×</button></span>
          ))}
        </div>
      )}
      <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} placeholder={`Add ${label.toLowerCase()}...`} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.65rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", color: "#fff", outline: "none" }} />
    </div>
  );
}

function LoadingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "80px", height: "80px", position: "relative" }}>
         <div className="spin" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#6366f1" }} />
         <div className="glow-pulse" style={{ position: "absolute", inset: "20px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.6), transparent)" }} />
      </div>
      <p className="animate-fade-up delay-200" style={{ marginTop: "2rem", color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 600 }}>Analyzing trajectory...</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESULTS: VISUAL TRAJECTORY GRAPH
══════════════════════════════════════════════════════════════════ */
const ACCENTS = [
  { from: "#6366f1", to: "#a855f7", glow: "rgba(99,102,241,0.5)" }, // Indigo -> Purple
  { from: "#06b6d4", to: "#3b82f6", glow: "rgba(6,182,212,0.5)" }, // Cyan -> Blue
  { from: "#f59e0b", to: "#ef4444", glow: "rgba(245,158,11,0.5)" } // Amber -> Red
];

function ResultsPage({ result, source, onSelectPath, onRerun }: { result: SimulationResult, source: string, onSelectPath: (p: CareerPath)=>void, onRerun: ()=>void }) {
  const sorted = [...result.paths].sort((a, b) => b.fitScore - a.fitScore);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      <NavBar right={<button onClick={onRerun} style={{ fontSize: "0.75rem", color: "#94a3b8", background: "none", border: "1px solid rgba(255,255,255,0.1)", padding: "0.3rem 0.7rem", borderRadius: "0.5rem", cursor: "pointer" }}>← Back</button>} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", padding: "2rem 1.5rem 6rem", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div className="animate-fade-up" style={{ textAlign: "center", marginBottom: "1rem", position: "relative", zIndex: 10 }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", color: "#6366f1", textTransform: "uppercase", marginBottom: "0.5rem" }}>Career Intelligence Visualization</p>
          <h2 style={{ fontSize: "clamp(2rem,4vw,2.5rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff" }}>Trajectories Found</h2>
        </div>

        {/* --- TRAJECTORY GRAPH --- */}
        <div style={{ position: "relative", width: "100%", minHeight: "450px", marginTop: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          
          {/* SVG Background Lines */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "visible" }}>
            <svg width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="grad0" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={ACCENTS[0].from} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={ACCENTS[0].from} stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="grad1" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={ACCENTS[1].from} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={ACCENTS[1].from} stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={ACCENTS[2].from} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={ACCENTS[2].from} stopOpacity="0.8" />
                </linearGradient>
              </defs>
              
              {/* Path 1 (Left) */}
              <path d="M 50% 100% C 50% 60%, 16.6% 60%, 16.6% 0%" fill="none" stroke="url(#grad0)" strokeWidth="2" className="svg-trajectory-line delay-300" />
              {/* Path 2 (Center) */}
              <path d="M 50% 100% L 50% 0%" fill="none" stroke="url(#grad1)" strokeWidth="2" className="svg-trajectory-line delay-400" />
              {/* Path 3 (Right) */}
              <path d="M 50% 100% C 50% 60%, 83.3% 60%, 83.3% 0%" fill="none" stroke="url(#grad2)" strokeWidth="2" className="svg-trajectory-line delay-500" />
            </svg>
          </div>

          {/* Top Row: 3 Career Nodes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", zIndex: 10, position: "relative" }}>
            {sorted.map((path, idx) => (
              <VisualCareerCard key={path.title} path={path} accent={ACCENTS[idx]} delay={600 + idx * 200} onClick={() => onSelectPath(path)} />
            ))}
          </div>

          {/* Bottom Row: Current Profile Node */}
          <div className="animate-fade-up delay-200" style={{ display: "flex", justifyContent: "center", marginTop: "3rem", zIndex: 10, position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="glow-pulse" style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#e2e8f0", boxShadow: "0 0 20px rgba(255,255,255,0.6)", marginBottom: "0.75rem", border: "4px solid #090c14" }} />
              <div style={{ padding: "0.4rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", color: "#e2e8f0" }}>CURRENT PROFILE</div>
            </div>
          </div>
        </div>

        {/* --- COMPARISON BARS --- */}
        <div className="animate-fade-up delay-1200 glass" style={{ marginTop: "5rem", padding: "2rem", borderRadius: "1.25rem", width: "100%", maxWidth: "800px", margin: "5rem auto 0" }}>
          <h3 style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textTransform: "uppercase", marginBottom: "2rem" }}>Trajectory Comparison</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {sorted.map((path, idx) => (
              <div key={path.title} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0", width: "120px", flexShrink: 0, textAlign: "right" }}>{path.title}</span>
                <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
                  <div
                    className="bar-animate"
                    style={{
                      height: "100%", width: `${path.fitScore}%`, borderRadius: "3px",
                      background: `linear-gradient(90deg, ${ACCENTS[idx].from}, ${ACCENTS[idx].to})`,
                      boxShadow: `0 0 10px ${ACCENTS[idx].glow}`, animationDelay: `${1200 + idx*150}ms`
                    }}
                  />
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: ACCENTS[idx].from, width: "40px" }}>{path.fitScore}%</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function VisualCareerCard({ path, accent, delay, onClick }: { path: CareerPath, accent: {from:string,to:string,glow:string}, delay: number, onClick: ()=>void }) {
  return (
    <div
      className="animate-fade-up card-hover glass"
      style={{ animationDelay: `${delay}ms`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem 1.5rem", borderRadius: "1.25rem", position: "relative" }}
      onClick={onClick}
    >
      <div style={{ position: "absolute", top: "-1px", left: "20%", right: "20%", height: "2px", background: `linear-gradient(90deg, transparent, ${accent.from}, transparent)`, opacity: 0.8 }} />
      
      <RadialGauge score={path.fitScore} color={accent.from} delay={delay + 200} size={110} stroke={6} />
      
      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginTop: "1.5rem", textAlign: "center", lineHeight: 1.2 }}>{path.title}</h3>
      
      {/* Skill Gaps Mini-Viz */}
      <div style={{ width: "100%", marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {path.skillGaps.slice(0,2).map((sg: SkillGap) => (
          <div key={sg.skill} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "80px" }}>{sg.skill}</span>
            <div style={{ display: "flex", gap: "2px" }}>
              {[1,2,3,4,5].map(lvl => (
                <div key={lvl} style={{ width: "10px", height: "4px", borderRadius: "1px", background: lvl <= sg.currentLevel ? accent.from : lvl <= sg.targetLevel ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.03)" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: "1.5rem", fontSize: "0.75rem", fontWeight: 700, color: accent.from, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        Explore Path →
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL PAGE: VISUAL EXPLORATION
══════════════════════════════════════════════════════════════════ */
type DetailTab = "overview" | "roadmap" | "projects" | "first30";

function DetailPage({ path, onBack, onWhatIf }: { path: CareerPath, onBack: ()=>void, onWhatIf: (skill:string)=>void }) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const [whatIfVal, setWhatIfVal] = useState("");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar right={<button onClick={onBack} style={{ fontSize: "0.75rem", color: "#94a3b8", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.4rem 0.8rem", borderRadius: "0.5rem", cursor: "pointer" }}>← Overview</button>} />

      <main style={{ flex: 1, maxWidth: "900px", margin: "0 auto", width: "100%", padding: "3rem 1.5rem 6rem" }}>
        
        {/* Header Visualization */}
        <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "3rem" }}>
          <RadialGauge score={path.fitScore} size={120} color="#6366f1" />
          <div>
            <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.5rem", color: "#fff" }}>{path.title}</h2>
            <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6, maxWidth: "600px" }}>{path.summary}</p>
          </div>
        </div>

        {/* Tabs as sleek segmented controls */}
        <div className="animate-fade-up delay-100" style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "2.5rem" }}>
          {[
            { id: "overview", label: "Skill Map" },
            { id: "roadmap", label: "Trajectory" },
            { id: "projects", label: "Projects" },
            { id: "first30", label: "First 30 Days" }
          ].map(t => (
            <button
              key={t.id} onClick={() => setTab(t.id as DetailTab)}
              style={{ padding: "0.8rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, color: tab === t.id ? "#fff" : "#64748b", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "#6366f1" : "transparent"}`, cursor: "pointer", transition: "all 200ms" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Visual Content */}
        <div className="animate-fade-up delay-200">
          {tab === "overview" && <SkillMap path={path} />}
          {tab === "roadmap" && <VisualTrajectory path={path} />}
          {tab === "projects" && <VisualProjects path={path} />}
          {tab === "first30" && <Timeline30Days path={path} />}
        </div>

      </main>
    </div>
  );
}

/* ── 1. Skill Map (Visual Blocks) ───────────────────────────── */
function SkillMap({ path }: { path: CareerPath }) {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {path.skillGaps.map((sg, i) => (
        <div key={sg.skill} className="glass animate-fade-up" style={{ padding: "1.5rem", borderRadius: "1rem", animationDelay: `${i*100}ms`, display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.25rem" }}>{sg.skill}</h4>
            <span style={{ fontSize: "0.7rem", color: sg.importance === "high" ? "#ef4444" : sg.importance === "medium" ? "#f59e0b" : "#64748b", textTransform: "uppercase", fontWeight: 700 }}>{sg.importance} Priority</span>
          </div>
          
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[1,2,3,4,5].map(lvl => (
              <div
                key={lvl}
                style={{
                  width: "32px", height: "12px", borderRadius: "2px",
                  background: lvl <= sg.currentLevel ? "#6366f1" : lvl <= sg.targetLevel ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                  border: lvl > sg.currentLevel && lvl <= sg.targetLevel ? "1px dashed rgba(99,102,241,0.5)" : "none",
                  boxShadow: lvl <= sg.currentLevel ? "0 0 12px rgba(99,102,241,0.4)" : "none"
                }}
              />
            ))}
          </div>
          <div style={{ width: "40px", textAlign: "right", fontSize: "0.85rem", fontWeight: 800, color: "#fff" }}>{sg.targetLevel}/5</div>
        </div>
      ))}
      <div className="glass" style={{ padding: "1.5rem", borderRadius: "1rem", marginTop: "1rem" }}>
        <p style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.6 }}><span style={{ color: "#818cf8", fontWeight: 700 }}>Why it fits:</span> {path.whyItFits}</p>
      </div>
    </div>
  );
}

/* ── 2. Visual Trajectory (Roadmap) ─────────────────────────── */
function VisualTrajectory({ path }: { path: CareerPath }) {
  return (
    <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
      {/* Vertical Track */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: "1.5rem", width: "2px", background: "linear-gradient(to bottom, #6366f1, rgba(99,102,241,0.1))" }} />
      
      {path.milestones.map((m, i) => (
        <div key={i} className="animate-fade-up" style={{ position: "relative", paddingLeft: "2.5rem", paddingBottom: "3rem", animationDelay: `${i*150}ms` }}>
          {/* Node */}
          <div className="glow-pulse" style={{ position: "absolute", left: "-6px", top: "4px", width: "14px", height: "14px", borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 15px #6366f1", border: "3px solid #090c14" }} />
          
          <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "1rem" }}>{m.yearLabel}</h4>
          
          <div className="glass" style={{ padding: "1.25rem", borderRadius: "1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
              {m.skillsToLearn.map(s => (
                <span key={s} style={{ fontSize: "0.7rem", padding: "0.25rem 0.6rem", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderRadius: "999px", border: "1px solid rgba(99,102,241,0.3)" }}>{s}</span>
              ))}
            </div>
            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {m.goals.map((g, j) => (
                <li key={j} style={{ fontSize: "0.85rem", color: "#94a3b8", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <span style={{ color: "#6366f1" }}>■</span> {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 3. Projects (Tech Cards) ───────────────────────────────── */
function VisualProjects({ path }: { path: CareerPath }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.5rem" }}>
      {path.projects.map((proj, i) => (
        <div key={i} className="glass animate-fade-up card-hover" style={{ padding: "1.5rem", borderRadius: "1rem", display: "flex", flexDirection: "column", animationDelay: `${i*100}ms` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "#94a3b8" }}>0{i+1}</div>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: proj.difficulty==="beginner" ? "#34d399" : proj.difficulty==="advanced" ? "#f87171" : "#fbbf24", textTransform: "uppercase", letterSpacing: "0.05em" }}>{proj.weeks}w • {proj.difficulty}</span>
          </div>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>{proj.name}</h4>
          <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.6, flex: 1 }}>{proj.description}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "1.25rem" }}>
            {proj.skillsPracticed.map(s => (
              <span key={s} style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem", background: "rgba(255,255,255,0.05)", color: "#cbd5e1", borderRadius: "4px" }}>{s}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 4. First 30 Days (Horizontal Timeline) ─────────────────── */
function Timeline30Days({ path }: { path: CareerPath }) {
  const sorted = [...path.first30Days].sort((a,b) => a.week - b.week);
  
  return (
    <div style={{ width: "100%", overflowX: "auto", paddingBottom: "1rem" }}>
      <div style={{ display: "flex", minWidth: "max-content", paddingTop: "2rem" }}>
        {sorted.map((w, i) => (
          <div key={w.week} className="animate-fade-up" style={{ width: "260px", position: "relative", animationDelay: `${i*100}ms` }}>
            {/* Connecting Top Line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: i === sorted.length-1 ? "50%" : 0, height: "2px", background: "rgba(99,102,241,0.3)" }} />
            
            {/* Glowing Node */}
            <div className="glow-pulse" style={{ position: "absolute", top: "-5px", left: "20px", width: "12px", height: "12px", borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 10px #818cf8" }} />
            
            <div style={{ padding: "1.5rem 1.5rem 0 20px" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#fff", marginBottom: "1rem" }}>Week {w.week}</h4>
              <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {w.tasks.map((task, j) => (
                  <li key={j} style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div style={{ marginTop: "0.25rem", width: "4px", height: "4px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
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
