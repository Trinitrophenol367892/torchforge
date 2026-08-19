import { useMemo, useState } from "react";
import { Config, DatasetMeta, fmtParams, archSummary } from "../lib/types";
import { generateTrainPy, generateConfigJson, pipCommand } from "../lib/codegen";
import { highlightPythonLine, highlightJson } from "../lib/highlight";
import { downloadFile, useCopy, SectionTag } from "./ui";
import { IconCopy, IconCheck, IconDownload, IconTerminal, IconArrowR, IconBolt } from "./icons";

export default function CodePanel({
  cfg, meta, onTrain, onBack,
}: {
  cfg: Config;
  meta: DatasetMeta;
  onTrain: () => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"py" | "json">("py");
  const py = useMemo(() => generateTrainPy(cfg, meta), [cfg, meta]);
  const json = useMemo(() => generateConfigJson(cfg, meta), [cfg, meta]);
  const { total } = archSummary(cfg, meta);
  const lines = useMemo(() => py.split("\n"), [py]);
  const { copied, copy } = useCopy();

  return (
    <div className="rise space-y-4">
      {/* headline strip */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionTag tone="amber">02 · build</SectionTag>
          <h2 className="mt-3 font-display font-bold text-[28px] sm:text-[34px] leading-none text-frost">
            The pipeline is forged.
          </h2>
          <p className="mt-2 text-[13.5px] text-mist max-w-2xl">
            One self-contained <span className="font-mono text-amber">train.py</span> — data in, checkpoint and metrics out.
            {" "}{lines.length} lines · {fmtParams(total)} params · seed {cfg.seed}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToolBtn onClick={() => copy(tab === "py" ? py : json)} active={copied}
            label={copied ? "copied" : "copy"} icon={copied ? <IconCheck size={14} /> : <IconCopy size={14} />} />
          <ToolBtn onClick={() => downloadFile(tab === "py" ? "train.py" : "config.json", tab === "py" ? py : json, tab === "py" ? "text/x-python" : "application/json")}
            label="download" icon={<IconDownload size={14} />} />
        </div>
      </div>

      {/* run notes */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="border border-line rounded-md bg-panel/80 px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[9.5px] tracking-[0.2em] uppercase text-faint">1 · install</p>
            <p className="font-mono text-[12px] text-aqua mt-1 truncate">{pipCommand(cfg, meta)}</p>
          </div>
          <CopyMini text={pipCommand(cfg, meta)} />
        </div>
        <div className="border border-line rounded-md bg-panel/80 px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[9.5px] tracking-[0.2em] uppercase text-faint">2 · run</p>
            <p className="font-mono text-[12px] text-aqua mt-1 truncate">python train.py</p>
          </div>
          <CopyMini text="python train.py" />
        </div>
      </div>

      {/* code window */}
      <div className="border border-line rounded-lg overflow-hidden bg-[#0a0f19]">
        <div className="flex items-center justify-between border-b border-line bg-panel2/80 pl-2 pr-3">
          <div className="flex">
            {([["py", "train.py"], ["json", "config.json"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`relative px-4 py-2.5 font-mono text-[12px] transition-colors ${tab === k ? "text-frost" : "text-faint hover:text-mist"}`}>
                <span className="flex items-center gap-2">
                  <IconTerminal size={13} className={tab === k ? "text-amber" : ""} />
                  {label}
                </span>
                {tab === k && <span className="absolute left-2 right-2 -bottom-px h-[2px] bg-amber rounded-t" />}
              </button>
            ))}
          </div>
          <span className="font-mono text-[10.5px] text-faint">
            {tab === "py" ? `${lines.length} lines · python` : "spec · json"}
          </span>
        </div>

        {tab === "py" ? (
          <div className="code-scroll overflow-auto max-h-[560px] py-3 text-[12px] leading-[1.55] font-mono">
            {lines.map((ln, i) => (
              <div key={i} className="flex px-0 hover:bg-raise/30">
                <span className="ln w-11 shrink-0 text-right pr-3 select-none">{i + 1}</span>
                <span className="whitespace-pre pr-4 text-[#c9d7ec]">{ln.length ? highlightPythonLine(ln) : " "}</span>
              </div>
            ))}
          </div>
        ) : (
          <pre className="overflow-auto max-h-[560px] p-4 text-[12px] leading-[1.6] font-mono text-[#c9d7ec]">{highlightJson(json)}</pre>
        )}
      </div>

      {/* actions */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="btn-ghost font-mono text-[12px] px-4 py-2.5 rounded-md border border-line text-mist inline-flex items-center gap-2">
          ← adjust the spec
        </button>
        <button onClick={onTrain}
          className="btn-primary inline-flex items-center gap-2.5 font-display font-semibold text-[14.5px] px-7 py-3 rounded-md text-ink"
          style={{ background: "linear-gradient(180deg, #ffc36e, #ff9a3d)" }}>
          <IconBolt size={17} /> run the training
          <IconArrowR size={15} />
        </button>
      </div>
    </div>
  );
}

function ToolBtn(props: { onClick: () => void; label: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <button onClick={props.onClick}
      className={`btn-ghost inline-flex items-center gap-2 font-mono text-[12px] px-3.5 py-2 rounded-md border ${
        props.active ? "border-aqua/50 text-aqua bg-aqua/8" : "border-line text-mist hover:text-frost"
      }`}>
      {props.icon} {props.label}
    </button>
  );
}

function CopyMini({ text }: { text: string }) {
  const { copied, copy } = useCopy();
  return (
    <button onClick={() => copy(text)}
      className={`shrink-0 grid place-items-center w-8 h-8 rounded-md border transition-colors ${copied ? "border-aqua/50 text-aqua bg-aqua/8" : "border-line text-faint hover:text-mist hover:border-line"}`}>
      {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
    </button>
  );
}
