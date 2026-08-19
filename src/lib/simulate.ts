import { Config, DatasetMeta, archSummary, fmtInt, fmtLr, fmtParams, mulberry32 } from "./types";

export interface EpochRow {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  trainMetric: number;
  valMetric: number;
  lr: number;
  sec: number;
}
export interface LogLine { text: string; kind: "info" | "ok" | "warn" | "epoch" | "dim"; }
export interface ClassStat { label: string; precision: number; recall: number; f1: number; support: number; }
export interface RunResult {
  epochs: EpochRow[];
  setup: LogLine[];
  finalLines: LogLine[];
  bestEpoch: number;
  stoppedEarly: boolean;
  totalSec: number;
  params: number;
  testMetric: number; // acc for class, rmse for reg
  testReport: Record<string, number>;
  confusion: number[][] | null;
  classStats: ClassStat[] | null;
  metricKey: "accuracy" | "rmse";
  metricLabel: string;
  notes: string[];
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function simulateRun(cfg: Config, meta: DatasetMeta): RunResult {
  const rng = mulberry32(cfg.seed * 7919 + cfg.epochs * 31 + Math.round(cfg.lr * 1e6));
  const { total: params } = archSummary(cfg, meta);
  const isReg = cfg.task === "tabular-reg";
  const isImage = cfg.task === "image-class";
  const isText = cfg.task === "text-class";

  /* ---------- ceilings & rates ---------- */
  let ceiling = isReg ? meta.baseR2 : meta.baseAcc;

  // arch fitness for the dataset
  let fitness = 1;
  if (cfg.arch === "mlp" && cfg.datasetId === "cifar10") fitness *= 0.72;
  if (cfg.arch === "mlp" && isText) fitness *= 0.9;
  if (cfg.arch === "cnn" && cfg.datasetId === "cifar10") fitness *= 0.94;
  if (cfg.arch === "transformer") fitness *= 0.985;
  ceiling *= fitness;

  // capacity factor (too small = slower & slightly lower)
  const pMin = isImage ? 40_000 : isText ? 600_000 : 15_000;
  const capFactor = clamp(0.78 + 0.22 * Math.log10(Math.max(params, 1) / pMin), 0.62, 1.06);
  ceiling *= clamp(capFactor + 0.06, 0.7, 1.02);

  // lr quality
  const idealLog = cfg.optimizer === "sgd" ? -1.7 : -3;
  const dist = Math.abs(Math.log10(cfg.lr) - idealLog);
  let lrFactor = clamp(Math.exp(-dist * 0.6), 0.22, 1.1);
  let unstable = false;
  if (cfg.lr >= 0.05 && cfg.optimizer !== "sgd") { lrFactor *= 0.55; unstable = true; }
  if (cfg.lr >= 0.1) { lrFactor *= 0.6; unstable = true; }

  const optFactor = cfg.optimizer === "sgd" ? 0.82 : cfg.optimizer === "adamw" ? 1.05 : 1.0;
  const rate = 0.5 * optFactor * lrFactor * clamp(capFactor, 0.7, 1.05) * (cfg.scheduler === "cosine" ? 1.06 : 1);

  // overfitting pressure
  const smallData = clamp(1.6 - Math.log10(meta.samples) / 3, 0.5, 1.15);
  const archOverfit = cfg.arch === "transformer" ? 1.5 : cfg.arch === "lstm" ? 1.25 : cfg.arch === "deeper-cnn" ? 1.15 : cfg.arch === "cnn" ? 0.9 : 1;
  const augShield = (isImage && cfg.augment) ? 0.55 : isText ? 0.85 : 1;
  const overfitRate = 0.0045 * smallData * archOverfit * augShield * clamp(1.1 - cfg.dropout * 2.2, 0.25, 1.25);
  const overfitStart = 4 + cfg.dropout * 22 + (isImage && cfg.augment ? 3 : 0);

  const startLoss = isReg ? 1.18 : Math.log(Math.max(meta.classes, 2)) + 0.28;
  const metricFloor = isReg
    ? Math.sqrt(Math.max(0.05, 1 - ceiling)) * 1.02
    : 1 / Math.max(meta.classes, 2);
  const lossFloor = isReg ? metricFloor : Math.max(0.028, (1 - ceiling) * 1.7);

  /* ---------- epoch curves ---------- */
  const epochs: EpochRow[] = [];
  let best = Infinity, bestEpoch = 1, bad = 0, stoppedEarly = false;
  const baseGap = 0.008 + 0.02 * smallData * (cfg.valSplit < 10 ? 1.25 : 1);
  let t = 0;

  for (let e = 1; e <= cfg.epochs; e++) {
    t += 1;
    let lr = cfg.lr;
    if (cfg.scheduler === "step") lr = cfg.lr * Math.pow(0.5, Math.floor((e - 1) / Math.max(1, Math.floor(cfg.epochs / 3))));
    if (cfg.scheduler === "cosine") lr = cfg.lr * 0.5 * (1 + Math.cos((Math.PI * (e - 1)) / cfg.epochs));

    const learn = 1 - Math.exp(-rate * t * 0.55);
    const noise = () => (rng() - 0.5);
    const spike = unstable && rng() < 0.22 ? 0.25 + rng() * 0.3 : 0;

    let trainMetric: number, valMetric: number, trainLoss: number, valLoss: number;
    if (isReg) {
      trainMetric = metricFloor + (startLoss - metricFloor) * (1 - learn) + noise() * 0.02;   // rmse
      const gap = baseGap * 0.6 + overfitRate * Math.max(0, e - overfitStart) * 1.4;
      valMetric = trainMetric + gap + noise() * 0.018;
      trainLoss = trainMetric * trainMetric;
      valLoss = valMetric * valMetric + noise() * 0.006;
    } else {
      const accCap = clamp(ceiling, metricFloor + 0.05, 0.995);
      trainMetric = metricFloor + (accCap - metricFloor) * learn + noise() * 0.006;
      const gap = baseGap + overfitRate * Math.max(0, e - overfitStart) * 1.6;
      valMetric = clamp(trainMetric - gap + noise() * 0.008, 0.02, 0.995);
      trainLoss = lossFloor + (startLoss - lossFloor) * (1 - learn) * (1 + 0.25 * overfitRate * Math.max(0, e - overfitStart) * 8) + noise() * 0.02 + spike;
      valLoss = trainLoss + gap * 2.2 + noise() * 0.014 + spike * 0.7;
    }
    trainLoss = Math.max(0.008, trainLoss);
    valLoss = Math.max(0.01, valLoss);

    const sec =
      (isImage ? 1.25 : isText ? 1.7 : 0.18) +
      (params / 1e6) * (isText ? 1.1 : 0.8) +
      (meta.samples / 100000) * (isReg ? 0.05 : 0.9) +
      rng() * 0.25;

    epochs.push({ epoch: e, trainLoss, valLoss, trainMetric, valMetric, lr, sec: Math.max(0.08, sec) });

    const improved = isReg ? valMetric < best - 1e-9 : valMetric > best + 1e-9;
    if (improved || best === Infinity) {
      best = valMetric;
      bestEpoch = e;
      bad = 0;
    } else {
      bad += 1;
      if (cfg.patience > 0 && bad >= cfg.patience) { stoppedEarly = true; break; }
    }
  }

  const bestRow = epochs[bestEpoch - 1];
  const totalSec = epochs.reduce((s, r) => s + r.sec, 0) + 3.2;

  /* ---------- final test numbers ---------- */
  const notes: string[] = [];
  if (unstable) notes.push(`lr ${fmtLr(cfg.lr)} is hot for ${cfg.optimizer} — loss curve shows spikes. Consider ≤ 3e-3.`);
  if (stoppedEarly) notes.push(`Early stopping fired at epoch ${epochs.length} (patience ${cfg.patience}, best epoch ${bestEpoch}).`);
  const overfitting = !isReg
    ? bestRow && bestRow.trainMetric - bestRow.valMetric > 0.045
    : false;
  if (overfitting) notes.push(`Train/val gap of ${((bestRow.trainMetric - bestRow.valMetric) * 100).toFixed(1)} pts at best epoch — mild overfit. More dropout or augmentation would help.`);
  if (!stoppedEarly && !isReg && epochs.length >= 2) {
    const tail = epochs[epochs.length - 1];
    if (tail.valMetric < bestRow.valMetric - 0.01) notes.push(`Val accuracy drifted down after epoch ${bestEpoch} — the checkpoint at best epoch was used for test.`);
  }
  if (notes.length === 0) notes.push("Clean run: no divergence, no overfit flags. Checkpoint selected at best validation score.");

  let testReport: Record<string, number>;
  let confusion: number[][] | null = null;
  let classStats: ClassStat[] | null = null;
  let testMetric: number;

  const testN = Math.round(meta.samples * (cfg.testSplit / 100));

  if (!isReg) {
    const testAcc = clamp(bestRow.valMetric + (rng() - 0.4) * 0.012, 0.03, 0.995);
    testMetric = testAcc;
    const labels = meta.labels ?? Array.from({ length: meta.classes }, (_, i) => `c${i}`);
    // slightly imbalanced priors
    const priors = labels.map(() => 0.8 + rng() * 0.4);
    const pSum = priors.reduce((a, b) => a + b, 0);
    const counts = priors.map((p) => Math.max(8, Math.round((p / pSum) * testN)));
    confusion = labels.map((_, i) => {
      const n = counts[i];
      const accI = clamp(testAcc + (rng() - 0.5) * 0.07, 0.02, 0.995);
      const correct = Math.round(n * accI);
      const row = labels.map(() => 0);
      row[i] = correct;
      let rest = n - correct;
      const weights = labels.map((_, j) => (j === i ? 0 : priors[j] * (0.5 + rng())));
      const wSum = weights.reduce((a, b) => a + b, 0) || 1;
      let assigned = 0;
      labels.forEach((_, j) => {
        if (j === i) return;
        const v = Math.floor((weights[j] / wSum) * rest);
        row[j] = v; assigned += v;
      });
      let j = 0;
      while (assigned < rest) { const k = (i + 1 + j) % labels.length; if (k !== i) { row[k] += 1; assigned += 1; } j++; }
      return row;
    });
    // per-class stats from matrix
    const K = labels.length;
    classStats = labels.map((label, i) => {
      const tp = confusion![i][i];
      const fn = counts[i] - tp;
      let fp = 0;
      for (let r = 0; r < K; r++) if (r !== i) fp += confusion![r][i];
      const precision = tp / Math.max(1, tp + fp);
      const recall = tp / Math.max(1, tp + fn);
      const f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall);
      return { label, precision, recall, f1, support: counts[i] };
    });
    const macro = (k: "precision" | "recall" | "f1") =>
      classStats!.reduce((s, c) => s + c[k], 0) / K;
    const total = counts.reduce((a, b) => a + b, 0);
    const correct = confusion.reduce((s, r, i) => s + r[i], 0);
    testReport = {
      accuracy: correct / total,
      precision_macro: macro("precision"),
      recall_macro: macro("recall"),
      f1_macro: macro("f1"),
    };
  } else {
    const testRmse = Math.max(0.02, bestRow.valMetric * (1 + (rng() - 0.45) * 0.05));
    const mae = testRmse * (0.76 + rng() * 0.08);
    const r2 = clamp(1 - testRmse * testRmse / 1.0, -0.2, 0.99);
    testMetric = testRmse;
    testReport = { mae, rmse: testRmse, r2 };
  }

  /* ---------- console script ---------- */
  const deviceResolved = cfg.device === "auto" ? "cuda (simulated)" : cfg.device;
  const setup: LogLine[] = [
    { text: `$ python train.py`, kind: "info" },
    { text: `torch 2.4.1 · seed ${cfg.seed} · deterministic=true`, kind: "dim" },
    { text: `device: ${deviceResolved}`, kind: "dim" },
    { text: `dataset: ${meta.label} — ${fmtInt(meta.samples)} samples, ${meta.classes > 1 ? meta.classes + " classes" : "regression target"}`, kind: "dim" },
    { text: `splits: train ${fmtInt(Math.round(meta.samples * (1 - (cfg.valSplit + cfg.testSplit) / 100)))} · val ${fmtInt(Math.round(meta.samples * cfg.valSplit / 100))} · test ${fmtInt(testN)}`, kind: "dim" },
    { text: `model: ${cfg.arch} · ${fmtParams(params)} params (${fmtInt(params)})`, kind: "dim" },
    { text: `optimizer: ${cfg.optimizer} · lr ${fmtLr(cfg.lr)} · wd ${cfg.weightDecay} · schedule ${cfg.scheduler}`, kind: "dim" },
    { text: `→ training ${cfg.epochs} epochs · batch ${cfg.batch} · patience ${cfg.patience || "off"}`, kind: "ok" },
  ];
  if (unstable) setup.push({ text: `⚠ lr ${fmtLr(cfg.lr)} is aggressive for ${cfg.optimizer} — expect turbulence`, kind: "warn" });

  const finalLines: LogLine[] = [
    { text: `✔ best checkpoint: epoch ${bestEpoch} (best.pt)`, kind: "ok" },
    { text: `test ${isReg ? `rmse ${testReport.rmse.toFixed(4)} · mae ${testReport.mae.toFixed(4)} · r2 ${testReport.r2.toFixed(4)}` : `accuracy ${(testReport.accuracy * 100).toFixed(2)}% · f1_macro ${testReport.f1_macro.toFixed(4)}`}`, kind: "ok" },
    { text: `metrics.json + best.pt written · total ${totalSec.toFixed(1)}s`, kind: "dim" },
  ];

  return {
    epochs, setup, finalLines, bestEpoch, stoppedEarly, totalSec, params,
    testMetric, testReport, confusion, classStats,
    metricKey: isReg ? "rmse" : "accuracy",
    metricLabel: isReg ? "RMSE" : "Accuracy",
    notes,
  };
}

export function epochLogLine(r: EpochRow, total: number, isReg: boolean): LogLine {
  const pad = (n: number) => String(n).padStart(2, "0");
  const metric = isReg
    ? `rmse ${r.valMetric.toFixed(4)}`
    : `acc ${(r.valMetric * 100).toFixed(1)}%`;
  return {
    text: `epoch ${pad(r.epoch)}/${pad(total)} │ loss ${r.trainLoss.toFixed(4)} │ val ${metric} │ val_loss ${r.valLoss.toFixed(4)} │ lr ${r.lr.toExponential(1)} │ ${r.sec.toFixed(1)}s`,
    kind: "epoch",
  };
}
