"use client";
import { useState, useEffect, useRef } from "react";

/* ── LOGO ─────────────────────────────────────────────────────── */
export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";
  return (
    <span className={`font-black tracking-tighter text-[#13075B] ${cls}`}>
      Career<span className="text-[#2F05EA]">X</span>
    </span>
  );
}

/* ── NAV BAR ───────────────────────────────────────────────────── */
export function NavBar({ right, onLogoClick }: { right?: React.ReactNode; onLogoClick?: () => void }) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 h-20 bg-[#FCF8FF]/90 backdrop-blur-2xl border-b border-[#787682]/10">
      <button onClick={onLogoClick} className="focus-visible:outline-none">
        <Logo />
      </button>
      <div className="flex items-center gap-3">{right}</div>
    </nav>
  );
}

/* ── PRIMARY BUTTON ────────────────────────────────────────────── */
export function PrimaryBtn({
  children, onClick, disabled = false, type = "button", className = "", size = "md",
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  type?: "button" | "submit"; className?: string; size?: "sm" | "md" | "lg";
}) {
  const pad = size === "lg" ? "px-10 py-5 text-lg" : size === "sm" ? "px-4 py-2 text-sm" : "px-8 py-4";
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold text-white transition-all duration-300 ${
        disabled
          ? "opacity-40 cursor-not-allowed bg-[#787682]"
          : "cursor-pointer hover:-translate-y-0.5 hover:shadow-xl bg-[#13075B] hover:bg-[#2F05EA] shadow-md"
      } ${pad} ${className}`}
      style={{ letterSpacing: "-0.01em" }}
    >
      {children}
    </button>
  );
}

/* ── GHOST BUTTON ──────────────────────────────────────────────── */
export function GhostBtn({ children, onClick, className = "" }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={`px-4 py-2 rounded-lg border border-[#787682]/25 bg-white text-[#474551] font-bold hover:bg-[#EFECFC] transition-all text-sm ${className}`}
    >
      {children}
    </button>
  );
}

/* ── SECTION LABEL ─────────────────────────────────────────────── */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold tracking-[0.15em] text-[#13075B] uppercase mb-4 opacity-80">{children}</p>;
}

/* ── RADIAL GAUGE ──────────────────────────────────────────────── */
export function RadialGauge({
  score, size = 96, stroke = 8, color = "#2F05EA", delay = 0, label = "Fit", interactive = false, onClick,
}: {
  score: number; size?: number; stroke?: number; color?: string;
  delay?: number; label?: string; interactive?: boolean; onClick?: () => void;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => setOffset(circ - (score / 100) * circ), delay);
    return () => clearTimeout(t);
  }, [score, circ, delay]);

  return (
    <div
      className={`relative flex items-center justify-center ${interactive ? "cursor-pointer hover:scale-105 transition-transform duration-300" : ""}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 drop-shadow-sm">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFECFC" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-[1500ms]"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-black leading-none text-[#1B1B26] tracking-tighter" style={{ fontSize: `${size * 0.28}px` }}>{score}</span>
        <span className="font-bold text-[#787682] uppercase tracking-widest mt-0.5" style={{ fontSize: `${size * 0.1}px` }}>{label}</span>
      </div>
    </div>
  );
}

/* ── SKILL BAR ─────────────────────────────────────────────────── */
export function SkillBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay + 200);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-[#474551] w-48 flex-shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-2.5 bg-[#EFECFC] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-[1200ms] bg-[#13075B]" style={{ width: `${width}%` }} />
      </div>
      <span className="text-sm font-bold text-[#1B1B26] w-8 text-right">{value}</span>
    </div>
  );
}

/* ── STEP INDICATOR ─────────────────────────────────────────────── */
export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center mb-12 overflow-x-auto pb-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
              i < current ? "bg-[#13075B] border-[#13075B] text-white" :
              i === current ? "bg-[#EFECFC] border-[#2F05EA] text-[#2F05EA]" :
              "bg-white border-[#787682]/30 text-[#787682]"
            }`}>{i < current ? "✓" : String(i + 1).padStart(2, "0")}</div>
            <span className={`text-xs font-bold hidden sm:block ${i === current ? "text-[#13075B]" : "text-[#787682]"}`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-8 sm:w-14 mx-1 ${i < current ? "bg-[#13075B]" : "bg-[#EFECFC]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── TAG INPUT ─────────────────────────────────────────────────── */
export function TagInput({ label, tags, setTags, placeholder, helper }: {
  label: string; tags: string[]; setTags: (t: string[]) => void; placeholder: string; helper?: string;
}) {
  const [val, setVal] = useState("");
  const add = () => { const t = val.trim(); if (t && !tags.includes(t)) setTags([...tags, t]); setVal(""); };
  return (
    <div>
      <label className="block text-sm font-bold text-[#13075B] uppercase tracking-widest mb-2">{label}</label>
      {helper && <p className="text-xs text-[#787682] mb-3">{helper}</p>}
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((t, i) => (
          <span key={i} className="text-sm px-3 py-1.5 rounded-md bg-[#EFECFC] border border-[#2F05EA]/15 flex gap-2 items-center text-[#1B1B26] font-medium">
            {t}
            <button type="button" onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
              className="text-[#787682] hover:text-red-500 font-bold leading-none" aria-label={`Remove ${t}`}>×</button>
          </span>
        ))}
      </div>
      <input
        value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-[#787682]/30 bg-white focus:border-[#2F05EA] focus:ring-4 focus:ring-[#2F05EA]/10 outline-none shadow-sm transition-all text-[#1B1B26]"
      />
    </div>
  );
}

/* ── INSIGHT CARD ──────────────────────────────────────────────── */
export function InsightCard({ title, value, subtitle, accent = "indigo" }: {
  title: string; value: string | number; subtitle?: string; accent?: "indigo" | "amber" | "emerald" | "red";
}) {
  const borders: Record<string, string> = { indigo: "border-l-[#2F05EA]", amber: "border-l-amber-500", emerald: "border-l-emerald-500", red: "border-l-red-500" };
  const vals: Record<string, string> = { indigo: "text-[#2F05EA]", amber: "text-amber-600", emerald: "text-emerald-600", red: "text-red-600" };
  return (
    <div className={`glass p-6 rounded-2xl border-l-4 ${borders[accent]}`}>
      <p className="text-xs font-bold text-[#787682] uppercase tracking-widest mb-2">{title}</p>
      <p className={`text-2xl font-black ${vals[accent]}`}>{value}</p>
      {subtitle && <p className="text-sm text-[#474551] mt-1">{subtitle}</p>}
    </div>
  );
}

/* ── MODAL ─────────────────────────────────────────────────────── */
export function Modal({ open, onClose, children, maxWidth = "max-w-2xl" }: {
  open: boolean; onClose: () => void; children: React.ReactNode; maxWidth?: string;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1B1B26]/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-[2rem] p-8 lg:p-12 w-full ${maxWidth} shadow-2xl relative overflow-hidden animate-fade-up max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#EFECFC] font-bold text-[#787682] hover:text-[#1B1B26] transition-colors z-10"
          aria-label="Close">✕</button>
        {children}
      </div>
    </div>
  );
}

/* ── EMPTY STATE ─────────────────────────────────────────────────── */
export function EmptyState({ icon, title, description, action }: {
  icon?: string; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="text-5xl mb-6">{icon}</div>}
      <h3 className="text-xl font-bold text-[#1B1B26] mb-3">{title}</h3>
      <p className="text-[#474551] max-w-md mb-8">{description}</p>
      {action}
    </div>
  );
}

/* ── SPINNER ─────────────────────────────────────────────────────── */
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className="spin absolute inset-0 rounded-full border-4 border-transparent border-t-[#2F05EA]" />
        <div className="spin-rev absolute inset-3 rounded-full border-4 border-transparent border-t-[#13075B]/30" />
      </div>
      {label && <p className="text-sm font-bold text-[#13075B] tracking-[0.15em] uppercase">{label}</p>}
    </div>
  );
}

/* ── ACTION CARD ─────────────────────────────────────────────────── */
export function ActionCard({ priority, title, reason, cta, onClick }: {
  priority: "high" | "medium" | "low"; title: string; reason: string; cta: string; onClick: () => void;
}) {
  const colors = {
    high:   { bar: "bg-red-500",     badge: "bg-red-50 text-red-600",    label: "High Priority" },
    medium: { bar: "bg-amber-400",   badge: "bg-amber-50 text-amber-700", label: "Recommended" },
    low:    { bar: "bg-[#2F05EA]",   badge: "bg-indigo-50 text-indigo-600", label: "Upcoming" },
  }[priority];
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#787682]/10 shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${colors.bar}`} />
      <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-md ${colors.badge} inline-block mb-4`}>{colors.label}</span>
      <h4 className="text-base font-bold text-[#1B1B26] mb-2">{title}</h4>
      <p className="text-sm text-[#474551] mb-6">{reason}</p>
      <button onClick={onClick} className="w-full py-3 rounded-xl bg-[#13075B] text-white font-bold hover:bg-[#2F05EA] transition-colors text-sm">{cta}</button>
    </div>
  );
}

/* ── USE COUNTDOWN ───────────────────────────────────────────────── */
export function useScrollRef() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); });
  return ref;
}
