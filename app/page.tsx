"use client";

import { useState, useRef } from "react";
import type { SimulationResult, CareerPath } from "@/lib/schema";

/* ─── Types ───────────────────────────────────────────────────── */
type AppState = "landing" | "profile" | "loading" | "results" | "detail";

/* ─── Main App ─────────────────────────────────────────────────── */
export default function HomePage() {
  const [state, setState] = useState<AppState>("landing");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");
  const [lastPayload, setLastPayload] = useState<{ year: number; skills: string[]; interests: string[] } | null>(null);

  function handleTryExample() {
    setState("profile");
  }

  function handleBack() {
    if (state === "detail") setState("results");
    else if (state === "results") setState("profile");
    else setState("landing");
  }

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
      const src = res.headers.get("x-careerx-source") ?? "";
      setSource(src);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Something went wrong.");
        setState("profile");
        return;
      }
      setResult(data);
      setState("results");
    } catch {
      setError("Network error. Please try again.");
      setState("profile");
    }
  }

  function handleSelectPath(path: CareerPath) {
    setSelectedPath(path);
    setState("detail");
  }

  function handleWhatIf(newSkill: string) {
    if (!lastPayload) return;
    const updatedSkills = lastPayload.skills.includes(newSkill)
      ? lastPayload.skills
      : [...lastPayload.skills, newSkill];
    handleSimulate({ ...lastPayload, skills: updatedSkills });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {state === "landing" && <LandingPage onStart={() => setState("profile")} onTryExample={handleTryExample} />}
      {state === "profile" && (
        <ProfilePage
          onSubmit={handleSimulate}
          error={error}
          onClearError={() => setError(null)}
        />
      )}
      {state === "loading" && <LoadingPage />}
      {state === "results" && result && (
        <ResultsPage
          result={result}
          source={source}
          onSelectPath={handleSelectPath}
          onBack={handleBack}
          onRerun={() => setState("profile")}
        />
      )}
      {state === "detail" && selectedPath && (
        <DetailPage
          path={selectedPath}
          onBack={handleBack}
          onWhatIf={(skill) => {
            setState("profile");
          }}
        />
      )}
    </div>
  );
}

/* ─── Landing Page ─────────────────────────────────────────────── */
function LandingPage({
  onStart,
  onTryExample,
}: {
  onStart: () => void;
  onTryExample: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-indigo-950/40 to-gray-950" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 text-indigo-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
          CSI AITR × MLH · Prompt 2 Product · PS3
        </div>

        {/* Title */}
        <h1 className="text-6xl font-black tracking-tight mb-4">
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            CareerX
          </span>
        </h1>
        <p className="text-2xl font-semibold text-gray-200 mb-3">
          Three Futures. One Student.
        </p>
        <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
          Tell us where you are today — year of study, your skills, your interests.
          We&apos;ll show you three realistic career futures and exactly what each one demands from you.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStart}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-lg rounded-xl transition-all duration-150 shadow-lg shadow-indigo-500/25"
          >
            Explore My Futures →
          </button>
          <button
            onClick={onTryExample}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-lg rounded-xl transition-all duration-150"
          >
            Try Demo Persona
          </button>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-3 gap-6 text-center max-w-2xl mx-auto">
          {[
            { icon: "🎯", title: "Fit Score", desc: "See how well each path matches you right now" },
            { icon: "🗺️", title: "Roadmap", desc: "Year-by-year milestones to graduation" },
            { icon: "⚡", title: "First 30 Days", desc: "Concrete week-by-week actions to start today" },
          ].map((f) => (
            <div key={f.title} className="p-4 bg-white/3 rounded-xl border border-white/5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-semibold text-white mb-1">{f.title}</div>
              <div className="text-xs text-gray-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Page ─────────────────────────────────────────────── */
const DEMO_PERSONA = {
  year: 1,
  skills: ["Python", "C++", "HTML"],
  interests: ["AI", "Web Development"],
};

function ProfilePage({
  onSubmit,
  error,
  onClearError,
}: {
  onSubmit: (p: { year: number; skills: string[]; interests: string[] }) => void;
  error: string | null;
  onClearError: () => void;
}) {
  const [year, setYear] = useState<number>(1);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const skillRef = useRef<HTMLInputElement>(null);
  const interestRef = useRef<HTMLInputElement>(null);

  function addTag(
    val: string,
    list: string[],
    setList: (l: string[]) => void,
    setInput: (s: string) => void
  ) {
    const trimmed = val.trim();
    if (trimmed && !list.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      setList([...list, trimmed]);
    }
    setInput("");
  }

  function removeTag(idx: number, list: string[], setList: (l: string[]) => void) {
    setList(list.filter((_, i) => i !== idx));
  }

  function loadDemo() {
    setYear(DEMO_PERSONA.year);
    setSkills(DEMO_PERSONA.skills);
    setInterests(DEMO_PERSONA.interests);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onClearError();
    if (skills.length === 0 || interests.length === 0) return;
    onSubmit({ year, skills, interests });
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          CareerX
        </span>
        <button
          onClick={loadDemo}
          className="text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Load Demo Persona
        </button>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <h2 className="text-3xl font-bold mb-2">Your Profile</h2>
          <p className="text-gray-400 mb-8">Tell us about yourself so we can simulate three realistic career futures.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Year of Study</label>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                      year === y
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    Year {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Skills <span className="text-gray-500">({skills.length}/20)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((s, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 bg-indigo-500/15 text-indigo-300 text-sm px-3 py-1 rounded-full border border-indigo-500/25"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeTag(i, skills, setSkills)}
                      className="text-indigo-400 hover:text-white leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  ref={skillRef}
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(skillInput, skills, setSkills, setSkillInput);
                    }
                  }}
                  placeholder="e.g. Python, React, SQL…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => addTag(skillInput, skills, setSkills, setSkillInput)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-400 transition-colors"
                >
                  Add
                </button>
              </div>
              {skills.length === 0 && (
                <p className="text-xs text-gray-600 mt-1.5">Add at least one skill to continue</p>
              )}
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Interests <span className="text-gray-500">({interests.length}/20)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {interests.map((s, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 bg-violet-500/15 text-violet-300 text-sm px-3 py-1 rounded-full border border-violet-500/25"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeTag(i, interests, setInterests)}
                      className="text-violet-400 hover:text-white leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  ref={interestRef}
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(interestInput, interests, setInterests, setInterestInput);
                    }
                  }}
                  placeholder="e.g. AI, Cybersecurity, Design…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => addTag(interestInput, interests, setInterests, setInterestInput)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-400 transition-colors"
                >
                  Add
                </button>
              </div>
              {interests.length === 0 && (
                <p className="text-xs text-gray-600 mt-1.5">Add at least one interest to continue</p>
              )}
            </div>

            <button
              type="submit"
              disabled={skills.length === 0 || interests.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-all duration-150 shadow-lg shadow-indigo-500/20"
            >
              Simulate My Futures →
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ─── Loading Page ─────────────────────────────────────────────── */
function LoadingPage() {
  const steps = [
    "Analyzing your profile…",
    "Identifying career paths…",
    "Mapping skill gaps…",
    "Building your roadmap…",
    "Crafting your 30-day plan…",
  ];
  const [step] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Spinner */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
          <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>

        <h2 className="text-2xl font-bold mb-3">Simulating Your Futures</h2>
        <p className="text-gray-400 text-sm mb-8">
          Claude is analyzing your profile and generating three personalized career paths…
        </p>

        <div className="space-y-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className="flex items-center gap-3 text-sm text-left"
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i <= step ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-gray-600"}`}>
                {i < step ? "✓" : i === step ? "•" : "·"}
              </span>
              <span className={i <= step ? "text-gray-300" : "text-gray-600"}>{s}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-600">This typically takes 15–30 seconds</p>
      </div>
    </div>
  );
}

/* ─── Results Page ─────────────────────────────────────────────── */
function FitScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500/15 text-green-400 border-green-500/30"
    : score >= 65 ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
    : "bg-amber-500/15 text-amber-400 border-amber-500/30";

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {score}% fit
    </span>
  );
}

function ResultsPage({
  result,
  source,
  onSelectPath,
  onBack,
  onRerun,
}: {
  result: SimulationResult;
  source: string;
  onSelectPath: (p: CareerPath) => void;
  onBack: () => void;
  onRerun: () => void;
}) {
  const sorted = [...result.paths].sort((a, b) => b.fitScore - a.fitScore);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          CareerX
        </span>
        <div className="flex items-center gap-3">
          {source === "mock" && (
            <span className="text-xs px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/25">
              Mock Mode
            </span>
          )}
          {source === "fallback" && (
            <span className="text-xs px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-full border border-amber-500/25">
              Fallback Mode
            </span>
          )}
          <button
            onClick={onRerun}
            className="text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            ← Edit Profile
          </button>
        </div>
      </nav>

      <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Three Futures</h2>
          <p className="text-gray-400">Click any path to explore your roadmap, projects, and first 30 days.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-3">
          {sorted.map((path, idx) => (
            <button
              key={path.title}
              onClick={() => onSelectPath(path)}
              className="group text-left p-6 bg-white/3 hover:bg-white/6 border border-white/8 hover:border-indigo-500/40 rounded-2xl transition-all duration-200 flex flex-col gap-4"
            >
              {/* Rank badge */}
              <div className="flex items-start justify-between">
                <span className="text-2xl">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                </span>
                <FitScoreBadge score={path.fitScore} />
              </div>

              {/* Title & summary */}
              <div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                  {path.title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-3">{path.summary}</p>
              </div>

              {/* Why it fits */}
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
                <p className="text-xs text-indigo-300 font-medium mb-1">Why it fits you</p>
                <p className="text-xs text-gray-400 line-clamp-2">{path.whyItFits}</p>
              </div>

              {/* Top skill gap */}
              {path.skillGaps.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Top skill gaps</p>
                  <div className="flex flex-wrap gap-1">
                    {path.skillGaps.slice(0, 3).map((sg) => (
                      <span
                        key={sg.skill}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          sg.importance === "high"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : sg.importance === "medium"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}
                      >
                        {sg.skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto text-xs text-indigo-400 group-hover:text-indigo-300 font-medium">
                Explore this path →
              </div>
            </button>
          ))}
        </div>

        {/* Compare summary */}
        <div className="mt-8 p-6 bg-white/3 border border-white/8 rounded-2xl">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Quick Comparison</h3>
          <div className="space-y-3">
            {sorted.map((path) => (
              <div key={path.title} className="flex items-center gap-4">
                <span className="text-sm text-gray-400 w-40 truncate">{path.title}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                    style={{ width: `${path.fitScore}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-300 w-10 text-right">{path.fitScore}%</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Detail Page ─────────────────────────────────────────────── */
function DetailPage({
  path,
  onBack,
  onWhatIf,
}: {
  path: CareerPath;
  onBack: () => void;
  onWhatIf: (skill: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "milestones" | "projects" | "first30">("overview");
  const [whatIfSkill, setWhatIfSkill] = useState("");

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "milestones" as const, label: "Roadmap" },
    { id: "projects" as const, label: "Projects" },
    { id: "first30" as const, label: "First 30 Days" },
  ];

  function handleWhatIfSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (whatIfSkill.trim()) {
      onWhatIf(whatIfSkill.trim());
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-gray-950/90 backdrop-blur z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Paths
        </button>
        <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          CareerX
        </span>
        <div className="w-28" />
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-3xl font-bold">{path.title}</h2>
            <FitScoreBadge score={path.fitScore} />
          </div>
          <p className="text-gray-400 mb-4">{path.summary}</p>

          {/* Why it fits */}
          <div className="p-4 bg-indigo-500/8 border border-indigo-500/20 rounded-xl">
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wide mb-1.5">Why it fits you</p>
            <p className="text-gray-300 text-sm">{path.whyItFits}</p>
          </div>
          <div className="mt-3 p-4 bg-white/3 border border-white/8 rounded-xl">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Fit Score Reasoning</p>
            <p className="text-gray-400 text-sm">{path.fitReason}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/3 p-1 rounded-xl border border-white/8 w-full overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Skill Gaps</h3>
              <div className="space-y-3">
                {path.skillGaps.map((sg) => (
                  <div key={sg.skill} className="p-4 bg-white/3 border border-white/8 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{sg.skill}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          sg.importance === "high"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : sg.importance === "medium"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}
                      >
                        {sg.importance} priority
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Current</span>
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div
                            key={n}
                            className={`h-2 flex-1 rounded-full ${
                              n <= sg.currentLevel
                                ? "bg-gray-400"
                                : n <= sg.targetLevel
                                ? "bg-indigo-400/30 border border-indigo-400/30"
                                : "bg-white/5"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">Target: {sg.targetLevel}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Year-by-Year Roadmap</h3>
            {path.milestones.map((m, i) => (
              <div key={i} className="relative flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  {i < path.milestones.length - 1 && (
                    <div className="w-px flex-1 bg-white/10 mt-2" />
                  )}
                </div>
                <div className="pb-6">
                  <h4 className="font-semibold text-white mb-2">{m.yearLabel}</h4>
                  <div className="space-y-1 mb-3">
                    {m.goals.map((g, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="text-indigo-400 mt-0.5">›</span>
                        {g}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.skillsToLearn.map((s) => (
                      <span key={s} className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/10">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Recommended Projects</h3>
            {path.projects.map((proj, i) => (
              <div key={i} className="p-5 bg-white/3 border border-white/8 rounded-2xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{i + 1}. </span>
                    <h4 className="font-semibold text-white inline">{proj.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        proj.difficulty === "beginner"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : proj.difficulty === "intermediate"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {proj.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">{proj.weeks}w</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-3">{proj.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {proj.skillsPracticed.map((s) => (
                    <span key={s} className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "first30" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Your First 30 Days</h3>
            {path.first30Days
              .slice()
              .sort((a, b) => a.week - b.week)
              .map((week) => (
                <div key={week.week} className="p-5 bg-white/3 border border-white/8 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold">
                      W{week.week}
                    </div>
                    <h4 className="font-semibold">Week {week.week}</h4>
                  </div>
                  <ul className="space-y-2">
                    {week.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="text-indigo-400 mt-0.5 flex-shrink-0">✓</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}

        {/* What If Section */}
        <div className="mt-10 p-5 bg-gradient-to-r from-indigo-500/8 to-violet-500/8 border border-indigo-500/20 rounded-2xl">
          <h3 className="font-semibold mb-1">What if I learn…?</h3>
          <p className="text-gray-400 text-sm mb-4">
            Add a new skill to your profile and regenerate your three futures.
          </p>
          <form onSubmit={handleWhatIfSubmit} className="flex gap-3">
            <input
              value={whatIfSkill}
              onChange={(e) => setWhatIfSkill(e.target.value)}
              placeholder="e.g. TypeScript, Docker, Figma…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
            <button
              type="submit"
              disabled={!whatIfSkill.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Regenerate
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
