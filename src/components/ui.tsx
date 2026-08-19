import React, { useEffect, useRef, useState } from "react";
import { IconCheck } from "./icons";

/* ---------- animated number ---------- */
export function useCountUp(target: number, dur = 900, decimals = 0) {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return val.toFixed(decimals);
}

export function SectionTag({ children, tone = "amber" }: { children: React.ReactNode; tone?: "amber" | "aqua" | "sky" | "rose" }) {
  const tones: Record<string, string> = {
    amber: "text-amber border-amber/35 bg-amber/8",
    aqua: "text-aqua border-aqua/35 bg-aqua/8",
    sky: "text-sky border-sky/35 bg-sky/8",
    rose: "text-rose border-rose/35 bg-rose/8",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.18em] uppercase px-2.5 py-1 border rounded-sm ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ---------- option card ---------- */
export function OptCard(props: {
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  title: React.ReactNode;
  desc?: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onSelect}
      aria-pressed={props.selected}
      className={`opt-card relative text-left w-full border rounded-md ${props.compact ? "p-3" : "p-4"} ${
        props.selected ? "selected border-amber/60 bg-panel" : "border-line bg-panel2"
      }`}
    >
      <div className="flex items-start gap-3">
        {props.icon && (
          <span className={`mt-0.5 shrink-0 ${props.selected ? "text-amber" : "text-faint"}`}>{props.icon}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className={`block font-display font-semibold leading-tight ${props.compact ? "text-[13.5px]" : "text-[15px]"} ${props.selected ? "text-frost" : "text-mist"}`}>
            {props.title}
          </span>
          {props.desc && <span className="mt-0.5 block text-[12.5px] leading-snug text-faint">{props.desc}</span>}
          {props.meta && <span className="mt-2 block font-mono text-[11px] text-mist/90">{props.meta}</span>}
        </span>
        {props.badge}
      </div>
      <span
        className={`absolute top-2.5 right-2.5 grid place-items-center w-[18px] h-[18px] rounded-full border transition-all duration-200 ${
          props.selected ? "bg-amber border-amber text-ink scale-100" : "border-line text-transparent scale-75"
        }`}
      >
        <IconCheck size={11} strokeWidth={3} />
      </span>
    </button>
  );
}

/* ---------- slider ---------- */
export function SliderRow(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  aqua?: boolean;
  hint?: string;
}) {
  const pct = ((props.value - props.min) / (props.max - props.min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[13px] font-medium text-mist">{props.label}</span>
        <span className={`num-tick font-mono text-[13px] px-2 py-0.5 rounded-sm border ${props.aqua ? "text-aqua border-aqua/30 bg-aqua/8" : "text-amber border-amber/30 bg-amber/8"}`}>
          {props.format ? props.format(props.value) : props.value}
        </span>
      </div>
      <input
        type="range"
        className={`w-full ${props.aqua ? "aqua" : ""}`}
        style={{ "--fill": `${pct}%` } as React.CSSProperties}
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
      {props.hint && <p className="mt-1.5 text-[11.5px] text-faint">{props.hint}</p>}
    </div>
  );
}

/* ---------- toggle ---------- */
export function Toggle(props: { label: string; desc?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => props.onChange(!props.on)}
      className={`flex items-center justify-between w-full border rounded-md p-3.5 text-left opt-card ${props.on ? "selected border-aqua/50" : "border-line bg-panel2"}`}
      aria-pressed={props.on}
    >
      <span>
        <span className={`block text-[13.5px] font-medium ${props.on ? "text-frost" : "text-mist"}`}>{props.label}</span>
        {props.desc && <span className="block text-[12px] text-faint mt-0.5">{props.desc}</span>}
      </span>
      <span className={`relative shrink-0 ml-3 w-10 h-[22px] rounded-full transition-colors duration-200 ${props.on ? "bg-aqua/80" : "bg-line"}`}>
        <span
          className={`absolute top-[3px] w-4 h-4 rounded-full bg-ink transition-all duration-200 ${props.on ? "left-[21px]" : "left-[3px]"}`}
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,.5)" }}
        />
      </span>
    </button>
  );
}

/* ---------- chip (multi-select) ---------- */
export function MetricChip(props: { label: string; hint: string; on: boolean; onClick: () => void; locked?: boolean }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`opt-card border rounded-md p-3 text-left ${props.on ? "selected border-aqua/55" : "border-line bg-panel2"}`}
      aria-pressed={props.on}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={`font-mono text-[12.5px] font-semibold ${props.on ? "text-aqua" : "text-mist"}`}>{props.label}</span>
        <span className={`grid place-items-center w-4 h-4 rounded-sm border transition-colors ${props.on ? "bg-aqua border-aqua text-ink" : "border-line"}`}>
          {props.on && <IconCheck size={10} strokeWidth={3.2} />}
        </span>
      </span>
      <span className="block mt-1 text-[11.5px] text-faint">{props.hint}</span>
    </button>
  );
}

/* ---------- number stepper ---------- */
export function Stepper(props: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string }) {
  const s = props.step ?? 1;
  return (
    <div className="inline-flex items-center border border-line rounded-md bg-panel2 overflow-hidden">
      <button
        type="button"
        className="px-3 py-1.5 text-mist hover:text-amber hover:bg-raise transition-colors font-mono text-lg leading-none"
        onClick={() => props.onChange(Math.max(props.min, props.value - s))}
      >−</button>
      <span className="num-tick font-mono text-[13.5px] text-frost min-w-[64px] text-center border-x border-line py-1.5">
        {props.value}{props.suffix ?? ""}
      </span>
      <button
        type="button"
        className="px-3 py-1.5 text-mist hover:text-amber hover:bg-raise transition-colors font-mono text-lg leading-none"
        onClick={() => props.onChange(Math.min(props.max, props.value + s))}
      >+</button>
    </div>
  );
}

/* ---------- download / copy helpers ---------- */
export function downloadFile(name: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

export function useCopy(timeout = 1600) {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallback(text));
    } else fallback(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), timeout);
  };
  const fallback = (text: string) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  };
  return { copied, copy };
}
