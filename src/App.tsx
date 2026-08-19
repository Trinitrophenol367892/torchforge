import { useMemo, useState } from "react";
import { Config, defaultConfig, DATASETS, fmtInt } from "./lib/types";
import { simulateRun } from "./lib/simulate";
import Background from "./components/Background";
import Interview from "./components/Interview";
import CodePanel from "./components/CodePanel";
import TrainingView from "./components/TrainingView";
import EvalView from "./components/EvalView";
import { LogoMark, IconArrowR, IconBolt, IconSpec, IconTerminal, IconGauge, IconCheck } from "./components/icons";

type Phase = "intro" | "interview" | "code" | "train" | "eval";

const PHASES: { id: Phase; n: string; label: string; icon: React.ReactNode }[] = [
  { id: "interview", n: "01", label: "spec", icon: <IconSpec size={14} /> },
  { id: "code", n: "02", label: "build", icon: <IconTerminal size={14} /> },
  { id: "train", n: "03", label: "train", icon: <IconBolt size={14} /> },
  { id: "eval", n: "04", label: "evaluate", icon: <IconGauge size={14} /> },
];

export default function App() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [cfg, setCfg] = useState<Config>({ ...defaultConfig });
  const [specProgress, setSpecProgress] = useState(0);
  const meta = DATASETS.find((d) => d.id === cfg.datasetId) ?? DATASETS[0];
  const set = (patch: Partial<Config>) => setCfg((c) => ({ ...c, ...patch }));

  const run = useMemo(
    () => (phase === "train" || phase === "eval" ? simulateRun(cfg, meta) : null),
    [phase, cfg, meta]
  );

  const phaseIdx = PHASES.findIndex((p) => p.id === phase);

  return (
    <div className="relative min-h-screen text-frost">
      <Background />

      <div className="relative z-10">
        <Header phase={phase} specProgress={specProgress} phaseIdx={phaseIdx} goto={setPhase} />

        <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-24 pt-8">
          {phase === "intro" && <Intro onStart={() => setPhase("interview")} />}

          {phase === "interview" && (
            <Interview
              cfg={cfg}
              set={set}
              onProgress={setSpecProgress}
              onComplete={() => setPhase("code")}
            />
          )}

          {phase === "code" && (
            <CodePanel cfg={cfg} meta={meta} onTrain={() => setPhase("train")} onBack={() => setPhase("interview")} />
          )}

          {phase === "train" && run && (
            <TrainingView cfg={cfg} meta={meta} run={run} onEval={() => setPhase("eval")} onBack={() => setPhase("code")} />
          )}

          {phase === "eval" && run && (
            <EvalView
              cfg={cfg} meta={meta} run={run}
              onRestart={() => { setCfg({ ...defaultConfig }); setPhase("interview"); setSpecProgress(0); }}
              onBackTrain={() => setPhase("train")}
            />
          )}
        </main>

        <footer className="relative z-10 border-t border-linesoft">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10.5px] text-faint flex items-center gap-2">
              <LogoMark size={15} /> torchforge · spec-driven pytorch pipelines
            </p>
            <p className="font-mono text-[10.5px] text-faint">
              torch 2.4 · single-file output · deterministic seeds · simulation ≈ truth ±noise
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ================= header ================= */

function Header({ phase, specProgress, phaseIdx, goto }: {
  phase: Phase;
  specProgress: number;
  phaseIdx: number;
  goto: (p: Phase) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-linesoft bg-ink/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-[58px] flex items-center justify-between gap-4">
        <button className="flex items-center gap-2.5 group" onClick={() => goto(phase === "intro" ? "intro" : "intro")}>
          <LogoMark size={27} />
          <span className="text-left leading-none">
            <span className="block font-display font-bold text-[16px] tracking-tight text-frost group-hover:text-amber transition-colors">
              TorchForge
            </span>
            <span className="block font-mono text-[9px] tracking-[0.22em] uppercase text-faint mt-1">pytorch pipeline studio</span>
          </span>
        </button>

        {phase !== "intro" ? (
          <nav className="flex items-center gap-1 sm:gap-2">
            {PHASES.map((p, i) => {
              const done = i < phaseIdx;
              const active = i === phaseIdx;
              const reachable = i <= phaseIdx;
              return (
                <div key={p.id} className="flex items-center gap-1 sm:gap-2">
                  {i > 0 && <span className={`hidden sm:block w-5 lg:w-8 h-px transition-colors duration-500 ${done || active ? "bg-amber/60" : "bg-line"}`} />}
                  <button
                    onClick={() => reachable && goto(p.id)}
                    className={`relative flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md font-mono text-[11px] transition-all duration-200 ${
                      active ? "text-ink" : done ? "text-aqua hover:text-frost" : reachable ? "text-mist hover:text-frost" : "text-faint/50 cursor-default"
                    } ${active ? "bg-amber" : ""}`}
                  >
                    {done ? <IconCheck size={11} strokeWidth={3} /> : p.icon}
                    <span className="hidden md:inline">{p.label}</span>
                    {p.id === "interview" && active && (
                      <span className="absolute left-1 right-1 -bottom-[9px] h-[2px] bg-linesoft rounded overflow-hidden">
                        <span className="block h-full bg-amber transition-all duration-300" style={{ width: `${specProgress * 100}%` }} />
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        ) : (
          <span className="font-mono text-[10.5px] text-faint hidden sm:block">
            build <span className="text-amber">→</span> train <span className="text-amber">→</span> evaluate
          </span>
        )}
      </div>
    </header>
  );
}

/* ================= intro ================= */

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)] gap-10 items-start pt-6 lg:pt-14">
      {/* left: manifesto */}
      <div className="rise">
        <p className="font-mono text-[11.5px] text-aqua tracking-[0.08em]">
          <span className="text-faint">$</span> torchforge init <span className="caret-blink text-aqua">▊</span>
        </p>
        <h1 className="mt-5 font-display font-bold tracking-tight text-[44px] sm:text-[62px] leading-[0.98]">
          <span className="text-faint line-through decoration-rose/60 decoration-[3px]">Boilerplate.</span>
          <br />
          <span className="text-frost">An interview,</span>
          <br />
          <span className="relative inline-block text-amber">
            a pipeline.
            <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
              <path d="M2 6 C 40 2, 90 2, 198 5" stroke="#ff8a3d" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
            </svg>
          </span>
        </h1>
        <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-mist">
          The forge interviews you — dataset, architecture, optimizer, the works — then writes a
          complete <span className="font-mono text-amber text-[13.5px]">train.py</span>, runs the training
          loop live in front of you, and reads out the metrics. One seed, one file, fully reproducible.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <button
            onClick={onStart}
            className="btn-primary inline-flex items-center gap-3 font-display font-semibold text-[16px] px-8 py-4 rounded-md text-ink"
            style={{ background: "linear-gradient(180deg, #ffc36e, #ff9a3d)" }}
          >
            start the interview <IconArrowR size={17} />
          </button>
          <span className="font-mono text-[11px] text-faint">≈ 2 minutes · 10–12 questions</span>
        </div>

        {/* pipeline strip */}
        <div className="mt-12 max-w-xl border border-line rounded-lg bg-panel/90 px-5 py-4">
          <div className="flex items-center gap-3">
            {[
              { icon: <IconSpec size={15} />, k: "build", v: "nn.Module + loops", tone: "text-amber" },
              { icon: <IconBolt size={15} />, k: "train", v: "live epoch console", tone: "text-sky" },
              { icon: <IconGauge size={15} />, k: "evaluate", v: "metrics + confusion", tone: "text-aqua" },
            ].map((s, i) => (
              <div key={s.k} className="flex items-center gap-3 min-w-0 flex-1 group">
                {i > 0 && (
                  <svg width="26" height="10" viewBox="0 0 26 10" className="shrink-0 text-line">
                    <path d="M0 5h20M17 1.5 22 5l-5 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <div className="min-w-0">
                  <p className={`flex items-center gap-1.5 font-display font-semibold text-[14px] capitalize ${s.tone}`}>
                    <span className="group-hover:scale-110 inline-block transition-transform">{s.icon}</span>{s.k}
                  </p>
                  <p className="font-mono text-[10px] text-faint mt-0.5 truncate">{s.v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* right: intake ticket */}
      <div className="rise rise-2">
        <div className="relative border border-line rounded-lg bg-panel/90 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: "linear-gradient(90deg, #ff8a3d, #ffb454, #4fe0cd)" }} />
          <div className="px-5 py-4 border-b border-line bg-panel2/70 flex items-center justify-between">
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-mist">intake ticket</span>
            <span className="font-mono text-[10.5px] text-faint">Nº 0001</span>
          </div>
          <div className="p-5 space-y-3.5">
            {[
              ["the data", "modality · source · splits · augmentation"],
              ["the model", "architecture · capacity · regularization"],
              ["the run", "optimizer · lr · schedule · patience · seed"],
              ["the readout", "metrics · confusion matrix · report"],
            ].map(([k, v], i) => (
              <div key={k} className="flex items-start gap-3.5 group">
                <span className="num-tick font-mono text-[11px] text-amber mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 border-b border-dashed border-line flex-1 pb-2 group-hover:border-amber/40 transition-colors">
                  <span className="block font-display font-semibold text-[14.5px] text-frost capitalize">{k}</span>
                  <span className="block font-mono text-[10.5px] text-faint mt-0.5">{v}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3.5 border-t border-line bg-panel2/50 flex items-center justify-between">
            <span className="font-mono text-[10.5px] text-faint">output</span>
            <span className="font-mono text-[11px] text-aqua">train.py + config.json + best.pt + report.md</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            [`${DATASETS.length}`, "datasets wired"],
            ["5", "architectures"],
            ["1", "file to run"],
          ].map(([v, k]) => (
            <div key={k} className="border border-line rounded-md bg-panel/70 px-3 py-3 text-center hover:border-aqua/40 transition-colors">
              <p className="num-tick font-display font-bold text-[22px] text-frost">{v}</p>
              <p className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-faint mt-0.5">{k}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
