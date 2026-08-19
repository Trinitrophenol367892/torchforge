import { Config, DatasetMeta, archSummary, fmtLr, fmtParams, TASK_META } from "../lib/types";
import { useCountUp } from "./ui";
import { IconLayers, IconChip, IconDice, IconGauge } from "./icons";

export default function ModelPreview({ cfg, meta }: { cfg: Config; meta: DatasetMeta }) {
  const { layers, total } = archSummary(cfg, meta);
  const maxP = Math.max(...layers.map((l) => l.params), 1);
  const params = useCountUp(total, 650);
  const sigKey = `${cfg.arch}-${cfg.mlpPreset}-${cfg.cnnFilters}-${cfg.lstmHidden}-${cfg.lstmLayers}-${cfg.tfmDim}-${cfg.tfmLayers}-${cfg.datasetId}-${cfg.task}`;

  return (
    <aside className="border border-line rounded-lg bg-panel/80 backdrop-blur-[2px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-panel2/70">
        <span className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.22em] text-mist uppercase">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-aqua/40 animate-ping" />
            <span className="relative w-2 h-2 rounded-full bg-aqua" />
          </span>
          Live spec
        </span>
        <span className="font-mono text-[10.5px] text-faint">{layers.length} ops</span>
      </div>

      {/* params headline */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-faint">trainable params</p>
            <p className="num-tick font-display font-bold text-[34px] leading-none text-frost mt-1">
              {Number(params).toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <span className="mb-1 font-mono text-[12px] text-aqua">{fmtParams(total)}</span>
        </div>
        <div className="mt-3 h-[5px] rounded-full bg-linesoft overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(6, (Math.log10(Math.max(total, 10)) / 7) * 100))}%`,
              background: "linear-gradient(90deg, #2fbfae, #4fe0cd)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1 font-mono text-[9.5px] text-faint">
          <span>10²</span><span>tiny</span><span>10⁴</span><span>10⁶</span><span>10⁸</span>
        </div>
      </div>

      {/* layer stack */}
      <div key={sigKey} className="px-4 pb-4 space-y-[5px] rise">
        {layers.map((l, i) => (
          <div
            key={i}
            className="group flex items-center gap-2.5 border border-linesoft rounded-[5px] bg-panel2/60 px-2.5 py-[7px] hover:border-line hover:bg-raise/60 transition-colors"
          >
            <span className="font-mono text-[9.5px] text-faint w-4 text-right">{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[11.5px] text-frost leading-tight">{l.name}</span>
              <span className="block font-mono text-[10px] text-faint leading-tight truncate">{l.detail}</span>
            </span>
            <span className="shrink-0 w-16">
              <span className="block h-[4px] rounded-full bg-linesoft overflow-hidden">
                <span
                  className="block h-full rounded-full bg-amber/70 transition-all duration-500"
                  style={{ width: l.params > 0 ? `${Math.max(8, (Math.log10(l.params + 1) / Math.log10(maxP + 1)) * 100)}%` : "0%" }}
                />
              </span>
              <span className="block mt-0.5 font-mono text-[9.5px] text-right text-mist">{l.params > 0 ? fmtParams(l.params) : "—"}</span>
            </span>
          </div>
        ))}
      </div>

      {/* spec chips */}
      <div className="border-t border-line px-4 py-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 bg-panel2/50">
        <SpecChip icon={<IconLayers size={13} />} label="task" value={TASK_META[cfg.task].short} />
        <SpecChip icon={<IconGauge size={13} />} label="dataset" value={meta.label.toLowerCase()} />
        <SpecChip icon={<IconChip size={13} />} label="optimizer" value={`${cfg.optimizer} · ${fmtLr(cfg.lr)}`} />
        <SpecChip icon={<IconDice size={13} />} label="epochs" value={`${cfg.epochs} · bs ${cfg.batch}`} />
      </div>
    </aside>
  );
}

function SpecChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span className="flex items-center gap-2 min-w-0">
      <span className="text-faint shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-faint leading-none">{label}</span>
        <span className="block font-mono text-[11.5px] text-mist truncate leading-tight mt-[3px]">{value}</span>
      </span>
    </span>
  );
}
