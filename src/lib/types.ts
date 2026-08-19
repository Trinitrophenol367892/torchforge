export type TaskKind = "image-class" | "text-class" | "tabular-class" | "tabular-reg";
export type ArchKind = "mlp" | "cnn" | "deeper-cnn" | "lstm" | "transformer";
export type OptimizerKind = "adam" | "adamw" | "sgd";
export type SchedulerKind = "none" | "step" | "cosine";
export type DeviceKind = "auto" | "cpu" | "cuda" | "mps";

export interface DatasetMeta {
  id: string;
  label: string;
  task: TaskKind;
  source: "torchvision" | "torchtext" | "sklearn" | "custom";
  samples: number;
  classes: number;
  inDim: number; // feature dim for MLP path
  inputNote: string; // e.g. "28×28×1" or "30 numeric cols"
  blurb: string;
  baseAcc: number; // achievable ceiling for classification (0..1)
  baseR2: number; // ceiling for regression
  labels?: string[];
}

export interface Config {
  task: TaskKind;
  datasetId: string;
  customFeatures: number;
  customClasses: number;
  vocabSize: number;
  valSplit: number; // %
  testSplit: number; // %
  augment: boolean;
  maxLen: number;
  arch: ArchKind;
  mlpPreset: "slim" | "balanced" | "wide";
  cnnFilters: number;
  lstmHidden: number;
  lstmLayers: number;
  bidirectional: boolean;
  tfmDim: number;
  tfmLayers: number;
  dropout: number;
  batchNorm: boolean;
  optimizer: OptimizerKind;
  lr: number;
  weightDecay: number;
  epochs: number;
  batch: number;
  scheduler: SchedulerKind;
  patience: number; // 0 = off
  seed: number;
  device: DeviceKind;
  metrics: string[];
  confusion: boolean;
  name: string;
}

export const defaultConfig: Config = {
  task: "image-class",
  datasetId: "mnist",
  customFeatures: 24,
  customClasses: 4,
  vocabSize: 8000,
  valSplit: 15,
  testSplit: 15,
  augment: true,
  maxLen: 200,
  arch: "cnn",
  mlpPreset: "balanced",
  cnnFilters: 32,
  lstmHidden: 128,
  lstmLayers: 2,
  bidirectional: true,
  tfmDim: 128,
  tfmLayers: 4,
  dropout: 0.25,
  batchNorm: true,
  optimizer: "adamw",
  lr: 0.001,
  weightDecay: 0.0001,
  epochs: 12,
  batch: 128,
  scheduler: "cosine",
  patience: 5,
  seed: 1337,
  device: "auto",
  metrics: ["accuracy", "f1_macro"],
  confusion: true,
  name: "",
};

export const DATASETS: DatasetMeta[] = [
  {
    id: "mnist", label: "MNIST", task: "image-class", source: "torchvision",
    samples: 70000, classes: 10, inDim: 784, inputNote: "28×28×1 gray",
    blurb: "Handwritten digits — the 'hello world' of vision.", baseAcc: 0.985, baseR2: 0,
    labels: ["0","1","2","3","4","5","6","7","8","9"],
  },
  {
    id: "fashionmnist", label: "Fashion-MNIST", task: "image-class", source: "torchvision",
    samples: 70000, classes: 10, inDim: 784, inputNote: "28×28×1 gray",
    blurb: "Clothing articles, harder than digits.", baseAcc: 0.935, baseR2: 0,
    labels: ["T-shirt","Trouser","Pullover","Dress","Coat","Sandal","Shirt","Sneaker","Bag","Ankle boot"],
  },
  {
    id: "cifar10", label: "CIFAR-10", task: "image-class", source: "torchvision",
    samples: 60000, classes: 10, inDim: 3072, inputNote: "32×32×3 color",
    blurb: "Tiny color photos — a real fight for an MLP.", baseAcc: 0.84, baseR2: 0,
    labels: ["plane","car","bird","cat","deer","dog","frog","horse","ship","truck"],
  },
  {
    id: "agnews", label: "AG News", task: "text-class", source: "torchtext",
    samples: 127600, classes: 4, inDim: 9000, inputNote: "news headlines",
    blurb: "127k news items into World / Sports / Business / Sci-Tech.", baseAcc: 0.925, baseR2: 0,
    labels: ["World","Sports","Business","Sci/Tech"],
  },
  {
    id: "imdb", label: "IMDB Reviews", task: "text-class", source: "torchtext",
    samples: 50000, classes: 2, inDim: 10000, inputNote: "movie reviews",
    blurb: "25k train reviews, binary sentiment.", baseAcc: 0.885, baseR2: 0,
    labels: ["neg","pos"],
  },
  {
    id: "custom-text", label: "Custom text CSV", task: "text-class", source: "custom",
    samples: 12000, classes: 4, inDim: 8000, inputNote: "your columns",
    blurb: "A .csv with a text column and a label column.", baseAcc: 0.88, baseR2: 0,
  },
  {
    id: "wine", label: "Wine Quality", task: "tabular-class", source: "sklearn",
    samples: 6497, classes: 6, inDim: 11, inputNote: "11 physico-chem cols",
    blurb: "Predict the quality tier from chemistry.", baseAcc: 0.66, baseR2: 0,
    labels: ["3","4","5","6","7","8"],
  },
  {
    id: "breastcancer", label: "Breast Cancer", task: "tabular-class", source: "sklearn",
    samples: 569, classes: 2, inDim: 30, inputNote: "30 assay features",
    blurb: "Tiny, clean, classic binary diagnosis set.", baseAcc: 0.965, baseR2: 0,
    labels: ["malignant","benign"],
  },
  {
    id: "custom-tabular", label: "Custom CSV", task: "tabular-class", source: "custom",
    samples: 20000, classes: 4, inDim: 24, inputNote: "your columns",
    blurb: "Bring your own features + label column.", baseAcc: 0.87, baseR2: 0,
  },
  {
    id: "housing", label: "California Housing", task: "tabular-reg", source: "sklearn",
    samples: 20640, classes: 1, inDim: 8, inputNote: "8 census features",
    blurb: "Predict median house value ($100k).", baseAcc: 0, baseR2: 0.81,
  },
  {
    id: "diabetes", label: "Diabetes Progression", task: "tabular-reg", source: "sklearn",
    samples: 442, classes: 1, inDim: 10, inputNote: "10 baseline vars",
    blurb: "Tiny regression set — honest and noisy.", baseAcc: 0, baseR2: 0.52,
  },
  {
    id: "custom-reg", label: "Custom CSV", task: "tabular-reg", source: "custom",
    samples: 15000, classes: 1, inDim: 20, inputNote: "your columns",
    blurb: "Bring your own features + numeric target.", baseAcc: 0, baseR2: 0.74,
  },
];

export const getDataset = (id: string): DatasetMeta =>
  DATASETS.find((d) => d.id === id) ?? DATASETS[0];

export const TASK_META: Record<TaskKind, { label: string; short: string; isReg: boolean }> = {
  "image-class": { label: "Image classification", short: "vision", isReg: false },
  "text-class": { label: "Text classification", short: "text", isReg: false },
  "tabular-class": { label: "Tabular classification", short: "tabular", isReg: false },
  "tabular-reg": { label: "Tabular regression", short: "regression", isReg: true },
};

export const CLASS_METRICS = [
  { id: "accuracy", label: "Accuracy", hint: "overall hit rate" },
  { id: "precision_macro", label: "Precision (macro)", hint: "how clean are positive calls" },
  { id: "recall_macro", label: "Recall (macro)", hint: "how many did we catch" },
  { id: "f1_macro", label: "F1 (macro)", hint: "harmonic mean of P & R" },
];
export const REG_METRICS = [
  { id: "mae", label: "MAE", hint: "mean absolute error" },
  { id: "rmse", label: "RMSE", hint: "root mean squared error" },
  { id: "r2", label: "R²", hint: "variance explained" },
];

/* ---------------- architecture math ---------------- */

export function mlpHiddenLayers(preset: Config["mlpPreset"]): number[] {
  if (preset === "slim") return [128, 64];
  if (preset === "wide") return [512, 256, 128];
  return [256, 128];
}

export interface LayerRow { name: string; detail: string; params: number; }

export function archSummary(cfg: Config, meta: DatasetMeta): { layers: LayerRow[]; total: number } {
  const layers: LayerRow[] = [];
  const isReg = cfg.task === "tabular-reg";
  const outDim = isReg ? 1 : meta.classes;
  const inC = cfg.datasetId === "cifar10" ? 3 : 1;
  const hw = cfg.datasetId === "cifar10" ? 32 : 28;
  let total = 0;
  const add = (name: string, detail: string, params: number) => {
    layers.push({ name, detail, params });
    total += params;
  };

  if (cfg.arch === "mlp") {
    const hid = mlpHiddenLayers(cfg.mlpPreset);
    let prev = meta.inDim;
    add("Flatten", `${meta.inputNote} → ${meta.inDim}`, 0);
    hid.forEach((h, i) => {
      add(`Linear ${i + 1}`, `${prev} → ${h}${cfg.batchNorm ? " · BN · ReLU" : " · ReLU"}`, prev * h + h);
      if (cfg.batchNorm) add(`BatchNorm`, `${h}`, 2 * h);
      if (cfg.dropout > 0) add("Dropout", `p=${cfg.dropout}`, 0);
      prev = h;
    });
    add("Head", `${prev} → ${outDim}`, prev * outDim + outDim);
  } else if (cfg.arch === "cnn" || cfg.arch === "deeper-cnn") {
    const f = cfg.cnnFilters;
    add("Conv2d 1", `${inC}→${f}, 3×3, pad 1 · ReLU`, inC * f * 9 + f);
    add("MaxPool", "2×2", 0);
    add("Conv2d 2", `${f}→${f * 2}, 3×3 · ReLU`, f * (f * 2) * 9 + f * 2);
    add("MaxPool", "2×2", 0);
    let depth = f * 2;
    let side = hw / 4;
    if (cfg.arch === "deeper-cnn") {
      add("Conv2d 3", `${depth}→${depth * 2}, 3×3 · ReLU`, depth * (depth * 2) * 9 + depth * 2);
      add("MaxPool", "2×2", 0);
      depth *= 2;
      side = Math.floor(side / 2);
    }
    if (cfg.dropout > 0) add("Dropout2d", `p=${cfg.dropout}`, 0);
    const flat = depth * side * side;
    add("Flatten", `${depth}×${side}×${side} → ${flat}`, 0);
    add("Linear fc", `${flat} → 256 · ReLU`, flat * 256 + 256);
    add("Head", `256 → ${outDim}`, 256 * outDim + outDim);
  } else if (cfg.arch === "lstm") {
    const V = cfg.vocabSize, E = 128, H = cfg.lstmHidden, D = cfg.lstmLayers;
    add("Embedding", `${V} → ${E}`, V * E);
    add("LSTM", `${E} → ${H}${cfg.bidirectional ? " ×2 dir" : ""} · ${D} layer${D > 1 ? "s" : ""}`,
      D * 4 * ((E + (cfg.bidirectional ? 2 * H : H)) * (cfg.bidirectional ? 2 * H : H) + (cfg.bidirectional ? 2 * H : H)));
    if (cfg.dropout > 0) add("Dropout", `p=${cfg.dropout}`, 0);
    const feat = cfg.bidirectional ? 2 * H : H;
    add("Head", `${feat} → ${outDim}`, feat * outDim + outDim);
  } else {
    // transformer
    const V = cfg.vocabSize, d = cfg.tfmDim, L = cfg.tfmLayers, ff = d * 4;
    add("Embedding + Pos", `${V} → ${d}`, V * d + 512 * d);
    for (let i = 0; i < L; i++) {
      add(`Encoder ${i + 1}`, `attn ${d} · ff ${ff}`, 4 * d * d + 2 * d * ff + 8 * d);
    }
    add("Mean-pool → Head", `${d} → ${outDim}`, d * outDim + outDim);
  }
  return { layers, total };
}

/* ---------------- formatting ---------------- */

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
export function fmtParams(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}
export function fmtLr(lr: number): string {
  return lr.toExponential(1).replace("e-", "e-");
}
export function fmtClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const expName = (cfg: Config, meta: DatasetMeta): string =>
  cfg.name.trim() || `${meta.id}-${cfg.arch}-${cfg.optimizer}${cfg.seed}`;
