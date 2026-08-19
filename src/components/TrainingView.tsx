import { useEffect, useMemo, useRef, useState } from "react";
import { Config, DatasetMeta, fmtClock, fmtLr, fmtParams } from "../lib/types";
import { RunResult, LogLine, epochLogLine } from "../lib/simulate";
import { SectionTag } from "./ui";
import { IconArrowR, IconFast, IconSkip, IconGauge, IconChip, IconTerminal } from "./icons";

type Status = "running" | "done";

export default function TrainingView({
  cfg, meta, run, onEval, onBack,
}: {
  cfg: Config;
  meta: DatasetMeta;
  run: RunResult;
  onEval: () => void;
  onBack: () => void;
}) {
  const events = useMemo<LogLine[]>(() => [
    ...run.setup,
    ...run.epochs.map((e) => epochLogLine(e, cfg.epochs, cfg.task === "tabular-reg")),
    ...run.finalLines,
  ], [run, cfg]);

  const [step, setStep] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [status, setStatus] = useState<Status>("running");
  const logRef = useRef<HTMLDivElement>(null);

  const nSetup = run.setup.length;
  const nEpochs = run.epochs.length;
  const visibleEpochs = Math.max(0, Math.min(nEpochs, step - nSetup));
  const done = status === "done";

  useEffect(() => {
    if (done) return;
    if (step >= events.length) { setStatus("done"); return; }
    const isEpoch = step >= nSetup && step < nSetup + nEpochs;
    const row = isEpoch ? run.epochs[step - nSetup] : null;
    const base = row ? Math.min(950, 260 + row.sec * 200) : 150;
    const t = window.setTimeout(() => setStep((s) => s + 1), base / speed);
    return () => window.clearTimeout(t);
  }, [step, done, speed, events.length, nSetup, nEpochs, run, events]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [step]);

  const elapsed = run.epochs.slice(0, visibleEpochs).reduce((s, r) => s + r.sec, 0) + (step > 0 ? 2.4 : 0);
  const eta = Math.max(0, run.totalSec - elapsed);
  const lastRow = visibleEpochs > 0 ? run.epochs[visibleEpochs - 1] : null;
  const bestSoFar = run.epochs.slice(0, Math.max(1, visibleEpochs)).reduce((b, r, i) => {
    const cur = run.epochs[b].valMetric;
    const better = cfg.task === "tabular-reg" ? r.valMetric < cur : r.valMetric > cur;
    return better ? i : b;
  }, 0);
  const progress = visibleEpochs / nEpochs;
  const gpuBase = cfg.device === "cpu" ? 0 : Math.min(96, 48 + Math.log10(Math.max(run.params, 100)) * 7);
  const gpu = done ? 0 : Math.max(4, gpuBase + Math.sin(step * 1.7) * 9);

  const isReg = cfg.task === "tabular-reg";

  return (
    <div className="rise space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionTag tone="sky">03 · train</SectionTag>
          <h2 className="mt-3 font-display font-bold text-[28px] sm:text-[34px] leading-none text-frost">
            {done ? "Training complete." : "The loop is hot."}
          </h2>
          <p className="mt-2 font-mono text-[12px] text-mist">
            {cfg.name} · {meta.label} · {fmtParams(run.params)} params · seed {cfg.seed}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!done && (
            <>
              <div className="inline-flex border border-line rounded-md overflow-hidden bg-panel2">
                {[1, 3, 8].map((s) => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className={`font-mono text-[11.5px] px-3 py-1.5 transition-colors ${s > 1 ? "border-l border-line" : ""} ${speed === s ? "bg-sky/15 text-sky" : "text-mist hover:text-frost"}`}>
                    {s}×
                  </button>
                ))}
              </div>
              <button onClick={() => { setStep(events.length); setStatus("done"); }}
                className="btn-ghost inline-flex items-center gap-1.5 font-mono text-[11.5px] px-3 py-1.5 rounded-md border border-line text-mist hover:text-frost">
                <IconSkip size={12} /> skip
              </button>
            </>
          )}
        </div>
      </div>

      {/* progress rail */}
      <div className="border border-line rounded-md bg-panel/80 px-4 py-3">
        <div className="flex items-center justify-between font-mono text-[11px] text-mist mb-2">
          <span className="flex items-center gap-2">
            {!done && <span className="w-1.5 h-1.5 rounded-full bg-amber pulse-dot" />}
            {done ? `finished · ${nEpochs} epochs in ${fmtClock(run.totalSec)}` : `epoch ${visibleEpochs}/${nEpochs}`}
            {done && run.stoppedEarly && <span className="text-amber">· early-stopped</span>}
            {done && <span className="text-aqua">· best @ epoch {run.bestEpoch}</span>}
          </span>
          <span className="num-tick">{done ? fmtClock(run.totalSec) : `${fmtClock(elapsed)} elapsed · ~${fmtClock(eta)} left`}</span>
        </div>
        <div className="h-[7px] rounded-full bg-linesoft overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(done ? 1 : progress) * 100}%`, background: "linear-gradient(90deg, #ff8a3d, #ffb454)" }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 items-start">
        {/* console */}
        <div className="border border-line rounded-lg overflow-hidden bg-[#080d15]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-panel2/80">
            <span className="flex items-center gap-2 font-mono text-[11px] text-mist">
              <IconTerminal size={14} className="text-aqua" /> train.py — live console
            </span>
            <span className="flex gap-1.5">
              <i className="w-2.5 h-2.5 rounded-full bg-rose/70" />
              <i className="w-2.5 h-2.5 rounded-full bg-amber/70" />
              <i className="w-2.5 h-2.5 rounded-full bg-aqua/70" />
            </span>
          </div>
          <div ref={logRef} className="h-[430px] overflow-y-auto px-4 py-3 font-mono text-[11.5px] leading-[1.8]">
            {events.slice(0, step).map((ev, i) => (
              <div key={i} className={`flicker-in whitespace-pre-wrap break-words ${lineColor(ev.kind)}`}>
                {ev.text}
              </div>
            ))}
            {!done && <span className="caret-blink inline-block w-[7px] h-[14px] bg-aqua align-middle" />}
          </div>
        </div>

        {/* telemetry */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="epoch" value={done ? String(nEpochs) : String(visibleEpochs)} sub={`of ${nEpochs}`} />
            <Stat label={isReg ? "val rmse" : "val acc"} value={lastRow ? (isReg ? lastRow.valMetric.toFixed(4) : (lastRow.valMetric * 100).toFixed(1) + "%") : "—"} sub={lastRow ? `best ${isReg ? run.epochs[bestSoFar].valMetric.toFixed(4) : (run.epochs[bestSoFar].valMetric * 100).toFixed(1) + "%"}` : "warming up"} tone="aqua" />
            <Stat label="lr" value={lastRow ? fmtLr(lastRow.lr) : fmtLr(cfg.lr)} sub={cfg.scheduler} tone="sky" />
          </div>

          <CurveChart
            title="loss"
            series={[
              { label: "train", color: "#ffb454", values: run.epochs.slice(0, visibleEpochs).map((r) => r.trainLoss) },
              { label: "val", color: "#ff7a8f", values: run.epochs.slice(0, visibleEpochs).map((r) => r.valLoss) },
            ]}
            total={nEpochs}
            yFmt={(v) => v.toFixed(2)}
          />
          <CurveChart
            title={isReg ? "rmse (lower ↓)" : "accuracy (higher ↑)"}
            series={[
              { label: "train", color: "#2fbfae", values: run.epochs.slice(0, visibleEpochs).map((r) => r.trainMetric) },
              { label: "val", color: "#4fe0cd", values: run.epochs.slice(0, visibleEpochs).map((r) => r.valMetric) },
            ]}
            total={nEpochs}
            yFmt={(v) => (isReg ? v.toFixed(2) : (v * 100).toFixed(0) + "%")}
          />

          {/* gpu meter */}
          {cfg.device !== "cpu" && (
            <div className="border border-line rounded-md bg-panel/80 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-faint">
                  <IconChip size={13} /> {cfg.device === "auto" ? "cuda (sim)" : cfg.device} util
                </span>
                <span className="num-tick font-mono text-[12px] text-sky">{done ? "idle" : gpu.toFixed(0) + "%"}</span>
              </div>
              <div className="flex items-end gap-[3px] h-9">
                {Array.from({ length: 36 }).map((_, i) => (
                  <span key={i}
                    className="flex-1 rounded-[2px] meter-bar"
                    style={{
                      height: `${done ? 8 : Math.max(10, gpu + Math.sin(i * 0.9 + step) * 22)}%`,
                      background: done ? "#22314a" : `rgba(111,177,255,${0.25 + (i % 5) * 0.12})`,
                      animationDelay: `${(i % 7) * 0.09}s`,
                      animationPlayState: done ? "paused" : "running",
                    }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="btn-ghost font-mono text-[12px] px-4 py-2.5 rounded-md border border-line text-mist">
          ← back to code
        </button>
        <button onClick={onEval} disabled={!done}
          className="btn-primary inline-flex items-center gap-2.5 font-display font-semibold text-[14.5px] px-7 py-3 rounded-md text-ink"
          style={{ background: "linear-gradient(180deg, #6fe8d8, #2fbfae)" }}>
          <IconGauge size={17} /> open evaluation <IconArrowR size={15} />
        </button>
      </div>
    </div>
  );
}

function lineColor(kind: LogLine["kind"]): string {
  switch (kind) {
    case "ok": return "text-aqua";
    case "warn": return "text-amber";
    case "dim": return "text-faint";
    case "info": return "text-frost";
    default: return "text-mist";
  }
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "aqua" | "sky" }) {
  return (
    <div className="border border-line rounded-md bg-panel/80 px-3.5 py-3">
      <p className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-faint">{label}</p>
      <p className={`num-tick font-display font-bold text-[21px] leading-tight mt-1 ${tone === "aqua" ? "text-aqua" : tone === "sky" ? "text-sky" : "text-frost"}`}>{value}</p>
      {sub && <p className="font-mono text-[10px] text-faint mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function CurveChart({
  title, series, total, yFmt,
}: {
  title: string;
  series: { label: string; color: string; values: number[] }[];
  total: number;
  yFmt: (v: number) => string;
}) {
  const W = 560, H = 150, PADL = 42, PADR = 12, PADT = 10, PADB = 20;
  const all = series.flatMap((s) => s.values);
  const hasData = all.length > 0;
  const max = hasData ? Math.max(...all) * 1.12 : 1;
  const min = 0;
  const n = Math.max(total, 2);
  const x = (i: number) => PADL + (i / (n - 1)) * (W - PADL - PADR);
  const y = (v: number) => PADT + (1 - (v - min) / (max - min)) * (H - PADT - PADB);
  const ticks = [0.25, 0.5, 0.75, 1].map((t) => max * t);

  return (
    <div className="border border-line rounded-md bg-panel/80 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-faint">{title}</span>
        <span className="flex gap-3">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 font-mono text-[10.5px] text-mist">
              <span className="w-3 h-[3px] rounded-full" style={{ background: s.color }} />{s.label}
            </span>
          ))}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-1">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PADL} x2={W - PADR} y1={y(t)} y2={y(t)} stroke="#1a2740" strokeWidth="1" />
            <text x={PADL - 7} y={y(t) + 3} textAnchor="end" fontSize="9.5" fill="#5d7089" fontFamily="JetBrains Mono, monospace">{yFmt(t)}</text>
          </g>
        ))}
        <line x1={PADL} x2={W - PADR} y1={H - PADB} y2={H - PADB} stroke="#22314a" strokeWidth="1" />
        {[1, Math.ceil(n / 2), n].map((e) => (
          <text key={e} x={x(e - 1)} y={H - 6} textAnchor="middle" fontSize="9.5" fill="#5d7089" fontFamily="JetBrains Mono, monospace">{e}</text>
        ))}
        {series.map((s) => {
          if (s.values.length < 1) return null;
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          const last = s.values[s.values.length - 1];
          const li = s.values.length - 1;
          return (
            <g key={s.label}>
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />
              <circle cx={x(li)} cy={y(last)} r="3.4" fill={s.color} className="pulse-dot" />
            </g>
          );
        })}
        {!hasData && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="11" fill="#5d7089" fontFamily="JetBrains Mono, monospace">
            waiting for first epoch…
          </text>
        )}
      </svg>
    </div>
  );
}
