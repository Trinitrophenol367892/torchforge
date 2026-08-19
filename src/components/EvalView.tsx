import { Config, DatasetMeta, CLASS_METRICS, REG_METRICS, fmtInt, fmtParams, archSummary, fmtClock } from "../lib/types";
import { RunResult } from "../lib/simulate";
import { downloadFile, SectionTag, useCountUp } from "./ui";
import { IconDownload, IconRestart, IconSpark, IconArrowL, IconCheck } from "./icons";

export default function EvalView({
  cfg, meta, run, onRestart, onBackTrain,
}: {
  cfg: Config;
  meta: DatasetMeta;
  run: RunResult;
  onRestart: () => void;
  onBackTrain: () => void;
}) {
  const isReg = cfg.task === "tabular-reg";
  const allMetrics = isReg ? REG_METRICS : CLASS_METRICS;
  const shown = allMetrics.filter((m) => cfg.metrics.includes(m.id));
  const { total } = archSummary(cfg, meta);
  const labels = meta.labels ?? Array.from({ length: meta.classes }, (_, i) => `c${i}`);

  const report = () => buildReport(cfg, meta, run, total);

  return (
    <div className="rise space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionTag tone="rose">04 · evaluate</SectionTag>
          <h2 className="mt-3 font-display font-bold text-[28px] sm:text-[34px] leading-none text-frost">
            The verdict is in.
          </h2>
          <p className="mt-2 font-mono text-[12px] text-mist">
            exp/{cfg.name} · checkpoint best.pt @ epoch {run.bestEpoch} · {fmtInt(testSamples(cfg, meta))} test samples
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadFile(`${cfg.name}-report.md`, report(), "text/markdown")}
            className="btn-ghost inline-flex items-center gap-2 font-mono text-[12px] px-3.5 py-2 rounded-md border border-line text-mist hover:text-frost">
            <IconDownload size={14} /> run report
          </button>
          <button onClick={onRestart}
            className="btn-primary inline-flex items-center gap-2 font-display font-semibold text-[13.5px] px-5 py-2.5 rounded-md text-ink"
            style={{ background: "linear-gradient(180deg, #ffc36e, #ff9a3d)" }}>
            <IconRestart size={15} /> new experiment
          </button>
        </div>
      </div>

      {/* headline verdict */}
      <VerdictStrip cfg={cfg} meta={meta} run={run} />

      {/* metric cards */}
      <div className={`grid gap-3 ${shown.length === 2 ? "sm:grid-cols-2" : shown.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {shown.map((m, i) => (
          <MetricCard key={m.id} id={m.id} label={m.label} hint={m.hint} value={run.testReport[m.id] ?? 0} delay={i * 90} isReg={isReg} />
        ))}
        {!isReg && !cfg.metrics.includes("accuracy") && null}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-4 items-start">
        {/* confusion matrix */}
        {!isReg && cfg.confusion && run.confusion && (
          <div className="border border-line rounded-lg bg-panel/80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-faint">confusion · test set</span>
              <span className="font-mono text-[10.5px] text-faint">rows = true · cols = predicted</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <ConfusionGrid matrix={run.confusion} labels={labels} />
            </div>
          </div>
        )}

        {/* per-class / notes */}
        <div className="space-y-4">
          {!isReg && run.classStats && (
            <div className="border border-line rounded-lg bg-panel/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-line font-mono text-[10.5px] tracking-[0.2em] uppercase text-faint">
                per-class breakdown
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-panel2">
                    <tr className="font-mono text-[10px] tracking-[0.14em] uppercase text-faint">
                      <th className="px-4 py-2 font-medium">class</th>
                      <th className="px-2 py-2 font-medium">prec</th>
                      <th className="px-2 py-2 font-medium">rec</th>
                      <th className="px-4 py-2 font-medium w-[34%]">f1</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11.5px]">
                    {run.classStats.map((c) => (
                      <tr key={c.label} className="border-t border-linesoft hover:bg-raise/40 transition-colors">
                        <td className="px-4 py-2 text-mist max-w-[110px] truncate" title={`${c.label} · support ${fmtInt(c.support)}`}>{c.label}</td>
                        <td className="px-2 py-2 text-frost">{c.precision.toFixed(3)}</td>
                        <td className="px-2 py-2 text-frost">{c.recall.toFixed(3)}</td>
                        <td className="px-4 py-2">
                          <span className="flex items-center gap-2">
                            <span className="flex-1 h-[5px] rounded-full bg-linesoft overflow-hidden">
                              <span className="block h-full rounded-full" style={{ width: `${c.f1 * 100}%`, background: "linear-gradient(90deg,#2fbfae,#4fe0cd)" }} />
                            </span>
                            <span className="text-aqua w-11 text-right">{c.f1.toFixed(3)}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* run notes */}
          <div className="border border-line rounded-lg bg-panel/80 overflow-hidden">
            <div className="px-4 py-3 border-b border-line font-mono text-[10.5px] tracking-[0.2em] uppercase text-faint">
              run notes · from the forge
            </div>
            <ul className="px-4 py-3 space-y-2.5">
              {run.notes.map((n, i) => (
                <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-mist">
                  <IconSpark size={14} className="text-amber shrink-0 mt-0.5" />
                  {n}
                </li>
              ))}
              <li className="flex gap-2.5 text-[12.5px] leading-relaxed text-mist">
                <IconCheck size={14} className="text-aqua shrink-0 mt-0.5" />
                {fmtInt(run.params)} params trained {run.epochs.length} epochs in {fmtClock(run.totalSec)} (simulated) · identical script reproduces this curve with seed {cfg.seed}.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button onClick={onBackTrain} className="btn-ghost font-mono text-[12px] px-4 py-2.5 rounded-md border border-line text-mist inline-flex items-center gap-2">
          <IconArrowL size={13} /> replay training
        </button>
        <p className="font-mono text-[10.5px] text-faint hidden sm:block">
          torchforge · spec {fmtParams(total)} params · {meta.label} · {cfg.optimizer} @ {cfg.lr}
        </p>
      </div>
    </div>
  );
}

const testSamples = (cfg: Config, meta: DatasetMeta) => Math.round(meta.samples * (cfg.testSplit / 100));

function VerdictStrip({ cfg, meta, run }: { cfg: Config; meta: DatasetMeta; run: RunResult }) {
  const isReg = cfg.task === "tabular-reg";
  let headline: string, sub: string;
  if (isReg) {
    headline = `R² ${run.testReport.r2.toFixed(3)}`;
    sub = `explains ${(run.testReport.r2 * 100).toFixed(1)}% of target variance · RMSE ${run.testReport.rmse.toFixed(4)} on ${meta.label}`;
  } else {
    const acc = run.testReport.accuracy;
    const baseline = 1 / meta.classes;
    headline = `${(acc * 100).toFixed(2)}%`;
    sub = `test accuracy vs ${(baseline * 100).toFixed(1)}% chance baseline — a ${((acc - baseline) * 100).toFixed(1)} pt lift on ${meta.label}`;
  }
  return (
    <div className="relative border border-line rounded-lg overflow-hidden bg-panel/90">
      <div className="absolute inset-0 opacity-[0.5]" style={{ background: "radial-gradient(600px 120px at 15% 0%, rgba(79,224,205,0.12), transparent 70%)" }} />
      <div className="relative flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-faint">{isReg ? "fit quality" : "headline metric"}</p>
          <p className="num-tick font-display font-bold text-[44px] sm:text-[52px] leading-none text-aqua mt-1">{headline}</p>
        </div>
        <p className="font-mono text-[12.5px] text-mist max-w-md leading-relaxed">{sub}</p>
        <div className="ml-auto hidden md:flex items-center gap-5 font-mono text-[11px] text-faint">
          <MiniFact k="epochs run" v={String(run.epochs.length)} />
          <MiniFact k="best epoch" v={String(run.bestEpoch)} />
          <MiniFact k="runtime" v={fmtClock(run.totalSec)} />
        </div>
      </div>
    </div>
  );
}

function MiniFact({ k, v }: { k: string; v: string }) {
  return (
    <span className="text-center">
      <span className="block text-[9px] uppercase tracking-[0.16em]">{k}</span>
      <span className="block text-[15px] text-mist mt-0.5 num-tick">{v}</span>
    </span>
  );
}

function MetricCard({ id, label, hint, value, delay, isReg }: { id: string; label: string; hint: string; value: number; delay: number; isReg: boolean }) {
  const decimals = id === "accuracy" ? 2 : id === "r2" ? 3 : 4;
  const display = useCountUp(id === "accuracy" ? value * 100 : value, 1000 + delay, decimals);
  const tone = id === "accuracy" || id === "r2" ? "text-aqua" : "text-frost";
  return (
    <div className="rise border border-line rounded-lg bg-panel/80 px-4 py-4 hover:border-aqua/40 hover:-translate-y-0.5 transition-all duration-200">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-faint">{label}</p>
      <p className={`num-tick font-display font-bold text-[30px] leading-tight mt-1.5 ${tone}`}>
        {display}{id === "accuracy" ? "%" : ""}
      </p>
      <p className="font-mono text-[10.5px] text-faint mt-1">{hint} · test set</p>
    </div>
  );
}

function ConfusionGrid({ matrix, labels }: { matrix: number[][]; labels: string[] }) {
  const K = matrix.length;
  const rowMax = matrix.map((r) => Math.max(...r, 1));
  const cell = K > 6 ? 44 : 56;
  return (
    <div className="inline-block min-w-full">
      <div className="flex">
        <div style={{ width: 84 }} className="shrink-0" />
        {labels.map((l) => (
          <div key={l} className="font-mono text-[9px] text-faint text-center truncate px-0.5 pb-1" style={{ width: cell }} title={l}>
            {l.length > 5 ? l.slice(0, 4) + "…" : l}
          </div>
        ))}
      </div>
      {matrix.map((row, i) => (
        <div key={i} className="flex items-center">
          <div className="w-[84px] shrink-0 pr-2 font-mono text-[9.5px] text-faint text-right truncate" title={labels[i]}>{labels[i]}</div>
          {row.map((v, j) => {
            const frac = v / rowMax[i];
            const diag = i === j;
            return (
              <div
                key={j}
                title={`true ${labels[i]} → pred ${labels[j]}: ${fmtInt(v)}`}
                className={`grid place-items-center border border-ink/60 font-mono transition-transform duration-150 hover:scale-110 hover:z-10 cursor-default ${diag ? "text-ink" : "text-mist"}`}
                style={{
                  width: cell, height: cell * 0.72,
                  background: diag
                    ? `rgba(79,224,205,${0.25 + frac * 0.7})`
                    : frac > 0.02 ? `rgba(255,122,143,${0.08 + frac * 0.55})` : "rgba(26,39,64,0.5)",
                  fontSize: K > 6 ? 9 : 10.5,
                  color: diag && frac > 0.55 ? "#06231f" : diag ? "#bffff2" : undefined,
                }}
              >
                {v > 0 ? (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v) : ""}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex items-center gap-2 mt-3 font-mono text-[9.5px] text-faint">
        <span>diagonal</span>
        <span className="flex h-[8px] w-24 rounded-full overflow-hidden border border-linesoft">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex-1" style={{ background: `rgba(79,224,205,${0.25 + (i / 7) * 0.7})` }} />
          ))}
        </span>
        <span>correct share of true class</span>
      </div>
    </div>
  );
}

function buildReport(cfg: Config, meta: DatasetMeta, run: RunResult, params: number): string {
  const isReg = cfg.task === "tabular-reg";
  const lines: string[] = [];
  lines.push(`# Run report — ${cfg.name}`);
  lines.push("");
  lines.push(`Generated by TorchForge. Reproduce with \`seed ${cfg.seed}\`.`);
  lines.push("");
  lines.push(`## Spec`);
  lines.push(`| key | value |`);
  lines.push(`|---|---|`);
  lines.push(`| task | ${cfg.task} |`);
  lines.push(`| dataset | ${meta.label} (${fmtInt(meta.samples)} samples) |`);
  lines.push(`| splits | train ${100 - cfg.valSplit - cfg.testSplit}% / val ${cfg.valSplit}% / test ${cfg.testSplit}% |`);
  lines.push(`| model | ${cfg.arch}, ${fmtInt(params)} params, dropout ${cfg.dropout} |`);
  lines.push(`| optimizer | ${cfg.optimizer}, lr ${cfg.lr}, wd ${cfg.weightDecay} |`);
  lines.push(`| schedule | ${cfg.epochs} epochs, bs ${cfg.batch}, ${cfg.scheduler}, patience ${cfg.patience || "off"} |`);
  lines.push(`| device | ${cfg.device} |`);
  lines.push("");
  lines.push(`## Test results (best checkpoint @ epoch ${run.bestEpoch})`);
  lines.push(`| metric | value |`);
  lines.push(`|---|---|`);
  Object.entries(run.testReport).forEach(([k, v]) => lines.push(`| ${k} | ${v.toFixed(4)} |`));
  lines.push("");
  if (!isReg && run.classStats) {
    lines.push(`### Per-class`);
    lines.push(`| class | precision | recall | f1 | support |`);
    lines.push(`|---|---|---|---|---|`);
    run.classStats.forEach((c) => lines.push(`| ${c.label} | ${c.precision.toFixed(3)} | ${c.recall.toFixed(3)} | ${c.f1.toFixed(3)} | ${c.support} |`));
    lines.push("");
  }
  lines.push(`## Notes`);
  run.notes.forEach((n) => lines.push(`- ${n}`));
  lines.push(`- ${run.epochs.length} epochs in ${run.totalSec.toFixed(1)}s (simulated wall time).`);
  return lines.join("\n");
}
