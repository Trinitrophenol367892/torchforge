import React, { useEffect, useMemo, useState } from "react";
import {
  Config, DatasetMeta, DATASETS, TASK_META, TaskKind, ArchKind, CLASS_METRICS, REG_METRICS,
  fmtInt, fmtLr, fmtParams, archSummary, mlpHiddenLayers,
} from "../lib/types";
import ModelPreview from "./ModelPreview";
import { OptCard, SliderRow, Toggle, MetricChip, Stepper, SectionTag } from "./ui";
import {
  IconImage, IconText, IconTable, IconScatter, IconMLP, IconCNN, IconLSTM, IconTransformer,
  IconArrowR, IconArrowL, IconCheck, IconBolt, IconDice, IconChip, IconFlask, IconSpec,
} from "./icons";

const SECTIONS = ["dataset", "model", "training", "evaluation"];
const SECTION_LABEL: Record<string, string> = {
  dataset: "The data", model: "The model", training: "The training run", evaluation: "The readout",
};

const lrToSlider = (lr: number) => Math.round(((Math.log10(lr) + 5) / 4) * 100);
const sliderToLr = (s: number) => Number(Math.pow(10, -5 + (s / 100) * 4).toPrecision(2));

const TASK_ARCHS: Record<TaskKind, ArchKind[]> = {
  "image-class": ["mlp", "cnn", "deeper-cnn"],
  "text-class": ["mlp", "lstm", "transformer"],
  "tabular-class": ["mlp"],
  "tabular-reg": ["mlp"],
};

const ARCH_INFO: Record<ArchKind, { label: string; desc: string; icon: React.ReactNode }> = {
  mlp: { label: "MLP", desc: "Fully-connected stack. Fast, blunt, honest.", icon: <IconMLP size={22} /> },
  cnn: { label: "CNN", desc: "Two conv blocks + pooling. The image workhorse.", icon: <IconCNN size={22} /> },
  "deeper-cnn": { label: "Deep CNN", desc: "Three conv blocks — more capacity, more overfit risk.", icon: <IconCNN size={22} /> },
  lstm: { label: "BiLSTM", desc: "Recurrent memory over the token sequence.", icon: <IconLSTM size={22} /> },
  transformer: { label: "Transformer", desc: "Self-attention encoder, mean-pooled.", icon: <IconTransformer size={22} /> },
};

interface Question {
  id: string;
  section: number;
  prompt: string;
  sub?: string;
  el: React.ReactNode;
  summary: string;
}

export default function Interview({
  cfg, set, onComplete, onProgress,
}: {
  cfg: Config;
  set: (patch: Partial<Config>) => void;
  onComplete: (cfg: Config) => void;
  onProgress?: (frac: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const meta: DatasetMeta = DATASETS.find((d) => d.id === cfg.datasetId) ?? DATASETS[0];
  const isReg = cfg.task === "tabular-reg";
  const isImage = cfg.task === "image-class";
  const isText = cfg.task === "text-class";
  const isCustom = meta.source === "custom";

  const setTask = (t: TaskKind) => {
    const firstDs = DATASETS.find((d) => d.task === t)!;
    const arch = t === "image-class" ? "cnn" : t === "text-class" ? "lstm" : "mlp";
    set({
      task: t, datasetId: firstDs.id, arch,
      metrics: t === "tabular-reg" ? ["mae", "rmse", "r2"] : ["accuracy", "f1_macro"],
    });
  };

  const questions: Question[] = useMemo(() => {
    const list: Question[] = [];

    /* ---------- DATASET ---------- */
    list.push({
      id: "task", section: 0,
      prompt: "What are we solving?",
      sub: "Every choice downstream — loaders, architecture, loss, metrics — hangs off this one.",
      el: (
        <div className="grid sm:grid-cols-2 gap-3">
          {(Object.keys(TASK_META) as TaskKind[]).map((t) => (
            <OptCard
              key={t} selected={cfg.task === t} onSelect={() => setTask(t)}
              icon={t === "image-class" ? <IconImage size={22} /> : t === "text-class" ? <IconText size={22} /> : t === "tabular-reg" ? <IconScatter size={22} /> : <IconTable size={22} />}
              title={TASK_META[t].label}
              desc={
                t === "image-class" ? "Pixels in, class out — MNIST family or CIFAR." :
                t === "text-class" ? "Sequences of tokens into categories." :
                t === "tabular-reg" ? "Rows of numbers → a numeric target." :
                "Rows of numbers → discrete labels."
              }
            />
          ))}
        </div>
      ),
      summary: TASK_META[cfg.task].label,
    });

    list.push({
      id: "dataset", section: 0,
      prompt: "Which dataset feeds it?",
      sub: "Built-ins download themselves on first run. Custom CSVs expect a local file.",
      el: (
        <div className="grid sm:grid-cols-2 gap-3">
          {DATASETS.filter((d) => d.task === cfg.task).map((d) => (
            <OptCard
              key={d.id} selected={cfg.datasetId === d.id} onSelect={() => set({ datasetId: d.id })}
              icon={<IconFlask size={20} />}
              title={<>{d.label} <SourceBadge src={d.source} /></>}
              desc={d.blurb}
              meta={`${fmtInt(d.samples)} samples · ${d.classes > 1 ? d.classes + " classes" : "regression"} · ${d.inputNote}`}
            />
          ))}
        </div>
      ),
      summary: meta.label,
    });

    if (isCustom) {
      list.push({
        id: "custom-dims", section: 0,
        prompt: "Describe the file.",
        sub: "These dimensions shape the input layer and the output head.",
        el: (
          <div className="space-y-5">
            <SliderRow label="Feature columns" value={cfg.customFeatures} min={2} max={200}
              onChange={(v) => set({ customFeatures: v })} hint="Numeric columns the model will read." />
            {!isReg && (
              <SliderRow label="Distinct classes" value={cfg.customClasses} min={2} max={20} aqua
                onChange={(v) => set({ customClasses: v })} hint="Unique values in your label column." />
            )}
          </div>
        ),
        summary: `${cfg.customFeatures} features${isReg ? "" : ` · ${cfg.customClasses} classes`}`,
      });
    }
    if (isText) {
      list.push({
        id: "vocab", section: 0,
        prompt: "How large a vocabulary?",
        sub: "Tokens beyond this cap map to <unk>. Bigger vocab = bigger embedding table.",
        el: (
          <SliderRow label="Vocabulary size" value={cfg.vocabSize} min={1000} max={30000} step={500}
            format={(v) => fmtInt(v)} onChange={(v) => set({ vocabSize: v })}
            hint={`Embedding table: ${(cfg.vocabSize * 128 / 1000).toFixed(0)}K params at dim 128.`} />
        ),
        summary: `${fmtInt(cfg.vocabSize)} tokens`,
      });
    }

    list.push({
      id: "splits", section: 0,
      prompt: "How do we carve it up?",
      sub: "Train teaches, validation tunes the checkpoint choice, test delivers the verdict — once.",
      el: (
        <div className="space-y-5">
          <SliderRow label="Validation slice" value={cfg.valSplit} min={5} max={30}
            format={(v) => v + "%"} onChange={(v) => set({ valSplit: v })} />
          <SliderRow label="Test slice" value={cfg.testSplit} min={10} max={30} aqua
            format={(v) => v + "%"} onChange={(v) => set({ testSplit: v })} />
          <div className="flex gap-2 font-mono text-[11px] text-faint">
            <SplitBar train={100 - cfg.valSplit - cfg.testSplit} val={cfg.valSplit} test={cfg.testSplit} />
          </div>
          {isImage && (
            <Toggle on={cfg.augment} onChange={(v) => set({ augment: v })}
              label="Data augmentation" desc={cfg.datasetId === "cifar10" ? "Random crop + horizontal flip on the fly." : "Small random affine jitter on the fly."} />
          )}
          {isText && (
            <SliderRow label="Truncate sequences to" value={cfg.maxLen} min={50} max={512} step={10}
              format={(v) => v + " tok"} onChange={(v) => set({ maxLen: v })} />
          )}
        </div>
      ),
      summary: `train ${100 - cfg.valSplit - cfg.testSplit}% · val ${cfg.valSplit}% · test ${cfg.testSplit}%`,
    });

    /* ---------- MODEL ---------- */
    const archs = TASK_ARCHS[cfg.task];
    if (archs.length > 1) {
      list.push({
        id: "arch", section: 1,
        prompt: "Pick an architecture.",
        sub: isImage ? "A CNN usually beats an MLP by miles on pixels — but the MLP is a fine baseline to expose."
          : "Sequence models read order; the bag-of-words MLP ignores it.",
        el: (
          <div className="grid sm:grid-cols-2 gap-3">
            {archs.map((a) => (
              <OptCard key={a} selected={cfg.arch === a} onSelect={() => set({ arch: a })}
                icon={ARCH_INFO[a].icon} title={ARCH_INFO[a].label} desc={ARCH_INFO[a].desc}
                meta={archMeta(cfg, a, meta)} />
            ))}
          </div>
        ),
        summary: ARCH_INFO[cfg.arch].label,
      });
    }

    list.push({
      id: "capacity", section: 1,
      prompt: cfg.arch === "mlp" ? "How wide should it think?" : "How much capacity?",
      sub: "More capacity fits harder patterns — and memorises noise if the data is small.",
      el: capacityEl(cfg, set, meta),
      summary: capacitySummary(cfg),
    });

    list.push({
      id: "regularize", section: 1,
      prompt: "How hard do we regularize?",
      sub: "Dropout randomly silences units each step so nothing co-adapts into memorisation.",
      el: (
        <div className="space-y-5">
          <SliderRow label="Dropout rate" value={Math.round(cfg.dropout * 100)} min={0} max={60}
            format={(v) => (v / 100).toFixed(2)} onChange={(v) => set({ dropout: v / 100 })}
            hint={cfg.dropout === 0 ? "No dropout — rely on weight decay and early stopping." : cfg.dropout > 0.4 ? "Heavy dropout. Training will be slow to converge." : "A sane default band for most tasks."} />
          {cfg.arch === "mlp" && (
            <Toggle on={cfg.batchNorm} onChange={(v) => set({ batchNorm: v })}
              label="Batch normalization" desc="Normalizes activations per batch — faster, stabiler convergence." />
          )}
        </div>
      ),
      summary: `dropout ${cfg.dropout.toFixed(2)}${cfg.arch === "mlp" ? (cfg.batchNorm ? " · BN on" : " · BN off") : ""}`,
    });

    /* ---------- TRAINING ---------- */
    list.push({
      id: "optimizer", section: 2,
      prompt: "Choose the optimizer — and its temper.",
      sub: "Adam-family adapts per-parameter; SGD with momentum is slower but often generalizes a touch better.",
      el: (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-3">
            {(["adam", "adamw", "sgd"] as const).map((o) => (
              <OptCard compact key={o} selected={cfg.optimizer === o} onSelect={() => set({ optimizer: o })}
                title={<span className="font-mono">{o.toUpperCase()}</span>}
                desc={o === "adam" ? "adaptive moments" : o === "adamw" ? "decoupled weight decay" : "momentum 0.9"} />
            ))}
          </div>
          <SliderRow label="Learning rate (log scale)" value={lrToSlider(cfg.lr)} min={0} max={100}
            format={() => fmtLr(cfg.lr)} onChange={(v) => set({ lr: sliderToLr(v) })}
            hint={cfg.lr >= 0.05 && cfg.optimizer !== "sgd" ? "⚠ that is scorching for an Adam-family optimizer — expect spikes." : `sweet spot ≈ ${cfg.optimizer === "sgd" ? "2e-2" : "1e-3"} for ${cfg.optimizer}`} />
          <div>
            <p className="text-[13px] font-medium text-mist mb-2">Weight decay</p>
            <Seg value={String(cfg.weightDecay)} onChange={(v) => set({ weightDecay: Number(v) })}
              options={[["0", "off"], ["0.0001", "1e-4"], ["0.001", "1e-3"], ["0.01", "1e-2"]]} />
          </div>
        </div>
      ),
      summary: `${cfg.optimizer} · lr ${fmtLr(cfg.lr)} · wd ${cfg.weightDecay || "off"}`,
    });

    list.push({
      id: "schedule", section: 2,
      prompt: "Shape the run.",
      sub: "Epochs, batch size, and how the learning rate cools down as training matures.",
      el: (
        <div className="space-y-5">
          <SliderRow label="Epochs" value={cfg.epochs} min={2} max={40}
            onChange={(v) => set({ epochs: v })} hint="The simulator runs the whole schedule live." />
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <p className="text-[13px] font-medium text-mist mb-2">Batch size</p>
              <Seg value={String(cfg.batch)} onChange={(v) => set({ batch: Number(v) })}
                options={[["32", "32"], ["64", "64"], ["128", "128"], ["256", "256"]]} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-mist mb-2">LR schedule</p>
              <Seg value={cfg.scheduler} onChange={(v) => set({ scheduler: v as Config["scheduler"] })}
                options={[["none", "const"], ["step", "step↓"], ["cosine", "cosine"]]} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[13px] font-medium text-mist">Early stopping patience</p>
              <p className="text-[11.5px] text-faint mt-0.5">{cfg.patience === 0 ? "Disabled — runs all epochs." : `Halts after ${cfg.patience} epochs without val improvement.`}</p>
            </div>
            <Stepper value={cfg.patience} min={0} max={10} onChange={(v) => set({ patience: v })} />
          </div>
        </div>
      ),
      summary: `${cfg.epochs} epochs · bs ${cfg.batch} · ${cfg.scheduler} · patience ${cfg.patience || "off"}`,
    });

    list.push({
      id: "repro", section: 2,
      prompt: "Make it reproducible.",
      sub: "Same seed, same script, same numbers. That is the whole contract.",
      el: (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[13px] font-medium text-mist flex items-center gap-2"><IconDice size={15} className="text-faint" /> Random seed</p>
              <p className="text-[11.5px] text-faint mt-0.5">Seeds Python, NumPy and all Torch generators.</p>
            </div>
            <input
              type="number"
              value={cfg.seed}
              onChange={(e) => set({ seed: Number(e.target.value) || 0 })}
              className="num-tick font-mono text-[13.5px] bg-panel2 border border-line rounded-md px-3 py-1.5 w-28 text-frost focus:border-amber/60 focus:outline-none"
            />
          </div>
          <div>
            <p className="text-[13px] font-medium text-mist mb-2 flex items-center gap-2"><IconChip size={15} className="text-faint" /> Device</p>
            <Seg value={cfg.device} onChange={(v) => set({ device: v as Config["device"] })}
              options={[["auto", "auto"], ["cpu", "cpu"], ["cuda", "cuda"], ["mps", "mps"]]} />
            <p className="text-[11.5px] text-faint mt-2">auto → cuda if present, else mps, else cpu. The generated script resolves it at runtime.</p>
          </div>
        </div>
      ),
      summary: `seed ${cfg.seed} · ${cfg.device}`,
    });

    /* ---------- EVALUATION ---------- */
    list.push({
      id: "metrics", section: 3,
      prompt: "What counts as a win?",
      sub: isReg ? "Pick the numbers the final report leads with." : "Pick the numbers the final report leads with — at least one.",
      el: (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-3">
            {(isReg ? REG_METRICS : CLASS_METRICS).map((m) => (
              <MetricChip key={m.id} label={m.label} hint={m.hint}
                on={cfg.metrics.includes(m.id)}
                onClick={() => {
                  const has = cfg.metrics.includes(m.id);
                  if (has && cfg.metrics.length === 1) return;
                  set({ metrics: has ? cfg.metrics.filter((x) => x !== m.id) : [...cfg.metrics, m.id] });
                }} />
            ))}
          </div>
          {!isReg && (
            <Toggle on={cfg.confusion} onChange={(v) => set({ confusion: v })}
              label="Confusion matrix" desc="Render the full K×K error structure in the eval dashboard." />
          )}
        </div>
      ),
      summary: cfg.metrics.join(", ") + (!isReg && cfg.confusion ? " · confusion" : ""),
    });

    list.push({
      id: "review", section: 3,
      prompt: "Name the experiment.",
      sub: "One tag, stamped on the checkpoint, the metrics file and the run report.",
      el: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[13px] text-faint shrink-0">exp/</span>
            <input
              value={cfg.name}
              onChange={(e) => set({ name: e.target.value.replace(/[^a-z0-9-_.]/gi, "-").toLowerCase().slice(0, 40) })}
              placeholder={`${meta.id}-${cfg.arch}-s${cfg.seed}`}
              className="flex-1 font-mono text-[14px] bg-panel2 border border-line rounded-md px-3 py-2.5 text-frost placeholder:text-faint/60 focus:border-amber/60 focus:outline-none"
            />
          </div>
          <ReviewGrid cfg={cfg} meta={meta} />
        </div>
      ),
      summary: cfg.name || `${meta.id}-${cfg.arch}-s${cfg.seed}`,
    });

    return list;
  }, [cfg]);

  useEffect(() => {
    if (idx >= questions.length) setIdx(questions.length - 1);
  }, [questions.length, idx]);

  useEffect(() => {
    onProgress?.(idx / questions.length);
  }, [idx, questions.length, onProgress]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "Enter" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const q = questions[idx];
  const last = idx === questions.length - 1;
  const sectionStart = questions.findIndex((x) => x.section === q.section);
  const next = () => {
    if (last) onComplete({ ...cfg, name: cfg.name.trim() || `${meta.id}-${cfg.arch}-s${cfg.seed}` });
    else setIdx(idx + 1);
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_350px] gap-6 items-start">
      <div className="min-w-0">
        {/* answered trail */}
        {idx > 0 && (
          <div className="mb-4 space-y-1.5">
            {questions.slice(0, idx).map((qq, i) => (
              <button
                key={qq.id}
                onClick={() => setIdx(i)}
                className="group w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md border border-transparent hover:border-line hover:bg-panel/60 transition-colors"
              >
                <span className="grid place-items-center w-4 h-4 rounded-full bg-aqua/15 text-aqua shrink-0"><IconCheck size={9} strokeWidth={3} /></span>
                <span className="font-mono text-[11px] text-faint group-hover:text-mist transition-colors truncate">{qq.prompt}</span>
                <span className="mx-1 h-px flex-1 bg-linesoft max-w-8" />
                <span className="font-mono text-[11.5px] text-mist truncate">{qq.summary}</span>
                <span className="font-mono text-[10px] text-faint opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
              </button>
            ))}
          </div>
        )}

        {/* question card */}
        <div key={q.id} className="rise border border-line rounded-lg bg-panel/90 overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-7 pt-5">
            <SectionTag tone={q.section === 0 ? "amber" : q.section === 1 ? "aqua" : q.section === 2 ? "sky" : "rose"}>
              {SECTIONS[q.section]} · {SECTION_LABEL[SECTIONS[q.section]]}
            </SectionTag>
            <span className="font-mono text-[11px] text-faint num-tick">
              {String(idx + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
            </span>
          </div>
          <div className="px-5 sm:px-7 py-6">
            <p className="font-mono text-[12px] text-aqua mb-2">
              forge <span className="text-faint">▸</span>
            </p>
            <h2 className="font-display font-bold text-[26px] sm:text-[30px] leading-[1.08] text-frost">{q.prompt}</h2>
            {q.sub && <p className="mt-2.5 text-[13.5px] text-mist max-w-xl leading-relaxed">{q.sub}</p>}
            <div className="mt-7">{q.el}</div>
          </div>
          <div className="flex items-center justify-between gap-3 px-5 sm:px-7 py-4 border-t border-line bg-panel2/60">
            <button
              onClick={() => setIdx(Math.max(0, idx - 1))}
              className={`btn-ghost inline-flex items-center gap-2 font-mono text-[12px] px-4 py-2.5 rounded-md border border-line text-mist ${idx === 0 ? "opacity-30 pointer-events-none" : ""}`}
            >
              <IconArrowL size={14} /> back
            </button>
            <span className="hidden sm:block font-mono text-[10.5px] text-faint">press <kbd className="px-1.5 py-0.5 border border-line rounded bg-panel2 text-mist">enter ↵</kbd></span>
            <button
              onClick={next}
              className="btn-primary inline-flex items-center gap-2.5 font-display font-semibold text-[14px] px-6 py-2.5 rounded-md text-ink"
              style={{ background: "linear-gradient(180deg, #ffc36e, #ff9a3d)" }}
            >
              {last ? <>Forge the pipeline <IconBolt size={16} /></> : <>continue <IconArrowR size={15} /></>}
            </button>
          </div>
        </div>
      </div>

      {/* live preview rail */}
      <div className="lg:sticky lg:top-24">
        <ModelPreview cfg={cfg} meta={meta} />
        <p className="mt-3 px-1 font-mono text-[10.5px] leading-relaxed text-faint">
          <IconSpec size={12} className="inline mr-1.5 -mt-0.5" />
          The spec rebuilds itself on every answer — param counts included.
        </p>
      </div>
    </div>
  );
}

/* ================= helpers ================= */

function SourceBadge({ src }: { src: string }) {
  const map: Record<string, string> = { torchvision: "text-sky", torchtext: "text-aqua", sklearn: "text-lime", custom: "text-rose" };
  return <span className={`ml-1.5 font-mono text-[9.5px] tracking-wide uppercase ${map[src] ?? "text-faint"}`}>[{src}]</span>;
}

function Seg(props: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex border border-line rounded-md overflow-hidden bg-panel2">
      {props.options.map(([v, label], i) => (
        <button
          key={v}
          type="button"
          onClick={() => props.onChange(v)}
          className={`font-mono text-[12px] px-3.5 py-1.5 transition-colors ${i > 0 ? "border-l border-line" : ""} ${
            props.value === v ? "bg-amber/15 text-amber" : "text-mist hover:text-frost hover:bg-raise"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SplitBar({ train, val, test }: { train: number; val: number; test: number }) {
  return (
    <div className="w-full">
      <div className="flex h-[10px] rounded-full overflow-hidden border border-linesoft">
        <div className="bg-amber/70 transition-all duration-300" style={{ width: train + "%" }} />
        <div className="bg-aqua/70 transition-all duration-300" style={{ width: val + "%" }} />
        <div className="bg-sky/70 transition-all duration-300" style={{ width: test + "%" }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-amber/90">train {train}%</span>
        <span className="text-aqua/90">val {val}%</span>
        <span className="text-sky/90">test {test}%</span>
      </div>
    </div>
  );
}

function archMeta(cfg: Config, a: ArchKind, meta: DatasetMeta): string {
  const probe = { ...cfg, arch: a };
  const { total } = archSummary(probe, meta);
  return `≈ ${fmtParams(total)} params`;
}

function capacityEl(cfg: Config, set: (p: Partial<Config>) => void, meta: DatasetMeta): React.ReactNode {
  if (cfg.arch === "mlp") {
    return (
      <div className="grid sm:grid-cols-3 gap-3">
        {(["slim", "balanced", "wide"] as const).map((p) => {
          const probe = { ...cfg, mlpPreset: p };
          const { total } = archSummary(probe, meta);
          return (
            <OptCard key={p} selected={cfg.mlpPreset === p} onSelect={() => set({ mlpPreset: p })}
              title={<span className="capitalize">{p}</span>}
              desc={`hidden [${mlpHiddenLayers(p).join(", ")}]`}
              meta={`≈ ${fmtParams(total)} params`} />
          );
        })}
      </div>
    );
  }
  if (cfg.arch === "cnn" || cfg.arch === "deeper-cnn") {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-[13px] font-medium text-mist mb-2">Base filters</p>
          <Seg value={String(cfg.cnnFilters)} onChange={(v) => set({ cnnFilters: Number(v) })}
            options={[["16", "16"], ["32", "32"], ["64", "64"]]} />
        </div>
        <p className="text-[11.5px] text-faint">
          Blocks double the filter count at each pooling step {cfg.arch === "deeper-cnn" ? "(16→32→64 pattern)" : "(32→64 pattern)"}.
        </p>
      </div>
    );
  }
  if (cfg.arch === "lstm") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div><p className="text-[13px] font-medium text-mist">Hidden size</p><p className="text-[11.5px] text-faint mt-0.5">Per direction.</p></div>
          <Seg value={String(cfg.lstmHidden)} onChange={(v) => set({ lstmHidden: Number(v) })}
            options={[["64", "64"], ["128", "128"], ["256", "256"]]} />
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div><p className="text-[13px] font-medium text-mist">Stacked layers</p></div>
          <Stepper value={cfg.lstmLayers} min={1} max={3} onChange={(v) => set({ lstmLayers: v })} />
        </div>
        <Toggle on={cfg.bidirectional} onChange={(v) => set({ bidirectional: v })}
          label="Bidirectional" desc="Reads the sequence backwards too — doubles the hidden state." />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><p className="text-[13px] font-medium text-mist">Model dim</p><p className="text-[11.5px] text-faint mt-0.5">Attention heads = dim ÷ 32.</p></div>
        <Seg value={String(cfg.tfmDim)} onChange={(v) => set({ tfmDim: Number(v) })}
          options={[["64", "64"], ["128", "128"], ["256", "256"]]} />
      </div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><p className="text-[13px] font-medium text-mist">Encoder layers</p></div>
        <Seg value={String(cfg.tfmLayers)} onChange={(v) => set({ tfmLayers: Number(v) })}
          options={[["2", "2"], ["4", "4"], ["6", "6"]]} />
      </div>
    </div>
  );
}

function capacitySummary(cfg: Config): string {
  if (cfg.arch === "mlp") return `${cfg.mlpPreset} [${mlpHiddenLayers(cfg.mlpPreset).join("→")}]`;
  if (cfg.arch === "cnn" || cfg.arch === "deeper-cnn") return `filters ${cfg.cnnFilters}`;
  if (cfg.arch === "lstm") return `h${cfg.lstmHidden} ×${cfg.lstmLayers}${cfg.bidirectional ? " bi" : ""}`;
  return `d${cfg.tfmDim} ×${cfg.tfmLayers} layers`;
}

function ReviewGrid({ cfg, meta }: { cfg: Config; meta: DatasetMeta }) {
  const { total } = archSummary(cfg, meta);
  const rows: [string, string][] = [
    ["task", TASK_META[cfg.task].label],
    ["dataset", `${meta.label} · ${fmtInt(meta.samples)} samples`],
    ["splits", `${100 - cfg.valSplit - cfg.testSplit} / ${cfg.valSplit} / ${cfg.testSplit}`],
    ["model", `${ARCH_INFO[cfg.arch].label} · ${fmtParams(total)} params`],
    ["regularization", `dropout ${cfg.dropout.toFixed(2)}${cfg.arch === "mlp" && cfg.batchNorm ? " · BN" : ""}`],
    ["optimizer", `${cfg.optimizer} · lr ${fmtLr(cfg.lr)} · wd ${cfg.weightDecay || "—"}`],
    ["schedule", `${cfg.epochs} epochs · bs ${cfg.batch} · ${cfg.scheduler} · patience ${cfg.patience || "off"}`],
    ["reproducibility", `seed ${cfg.seed} · ${cfg.device}`],
    ["metrics", cfg.metrics.join(", ")],
  ];
  return (
    <div className="border border-line rounded-md overflow-hidden">
      <div className="px-4 py-2.5 border-b border-line bg-panel2/70 font-mono text-[10px] tracking-[0.2em] uppercase text-faint">
        full specification
      </div>
      <div className="divide-y divide-linesoft">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 px-4 py-2 hover:bg-raise/40 transition-colors">
            <span className="font-mono text-[11px] text-faint shrink-0">{k}</span>
            <span className="font-mono text-[12px] text-mist text-right">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
