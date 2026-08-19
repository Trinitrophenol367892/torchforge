import React from "react";

type P = { size?: number; className?: string; strokeWidth?: number };
const base = (p: P) => ({
  width: p.size ?? 18,
  height: p.size ?? 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: p.strokeWidth ?? 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: p.className,
});

export const LogoMark = ({ size = 26 }: P) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2.5 27.5 9v14L16 29.5 4.5 23V9L16 2.5Z" stroke="#ffb454" strokeWidth="2" strokeLinejoin="round" />
    <path d="M16 9c3 2.6 4.5 5 4.5 7.4 0 3-2 5.1-4.5 5.1s-4.5-2.1-4.5-5.1c0-1 .2-1.9.7-2.9.6 1 1.3 1.5 2.2 1.8-.4-2.2.2-4.5 1.6-6.3Z" fill="#ff8a3d" stroke="#ffd489" strokeWidth="1.1" strokeLinejoin="round" />
    <circle cx="16" cy="17.6" r="1.4" fill="#0b101a" />
  </svg>
);

export const IconImage = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
    <path d="M3.5 15.5 9 10l4.5 4.5L17 11l3.5 3.5" />
    <circle cx="9" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
export const IconText = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 10.5h16M4 15h10" />
    <path d="M17.5 14.5v5M15.5 19.5h4" />
  </svg>
);
export const IconTable = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M3.5 9.5h17M9.5 9.5v10M15 9.5v10" />
  </svg>
);
export const IconScatter = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4v16h16" />
    <path d="M7 16.5 17.5 7" strokeDasharray="2.5 2.5" />
    <circle cx="8.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconMLP = (p: P) => (
  <svg {...base(p)}>
    <circle cx="5" cy="8" r="1.8" /><circle cx="5" cy="16" r="1.8" />
    <circle cx="12" cy="5.5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="18.5" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
    <path d="M6.7 8.6 10.3 11.2M6.8 7.3 10.4 6M6.7 15.4 10.3 12.8M6.8 16.7 10.4 18M13.8 6.4 17.3 11M13.8 12h3.4M13.8 17.6 17.3 13" strokeWidth="1.1" />
  </svg>
);
export const IconCNN = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="11" height="11" rx="1" />
    <rect x="9.5" y="9.5" width="11" height="11" rx="1" />
    <path d="M6.5 7h5M6.5 10h3" strokeWidth="1.2" />
    <path d="M13 13h4.5M13 16h4.5" strokeWidth="1.2" />
  </svg>
);
export const IconLSTM = (p: P) => (
  <svg {...base(p)}>
    <rect x="8" y="8" width="8" height="8" rx="1.5" />
    <path d="M2.5 12h4M17.5 12h4" />
    <path d="M10 6c-3 0-3-2.5 0-2.5M14 18c3 0 3 2.5 0 2.5" strokeWidth="1.3" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const IconTransformer = (p: P) => (
  <svg {...base(p)}>
    <circle cx="5" cy="18" r="1.7" /><circle cx="12" cy="18" r="1.7" /><circle cx="19" cy="18" r="1.7" />
    <path d="M6.2 16.6C7.5 10 10 7.5 11.2 6.6" strokeWidth="1.2" />
    <path d="M12 16.2V6.8" strokeWidth="1.2" strokeDasharray="2.4 2" />
    <path d="M17.8 16.6C16.5 10 14 7.5 12.8 6.6" strokeWidth="1.2" />
    <circle cx="12" cy="5.5" r="1.6" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)} strokeWidth={2.2}><path d="M4.5 12.5 10 18 19.5 6.5" /></svg>
);
export const IconArrowR = (p: P) => (
  <svg {...base(p)} strokeWidth={2}><path d="M4 12h15M13.5 5.5 20 12l-6.5 6.5" /></svg>
);
export const IconArrowL = (p: P) => (
  <svg {...base(p)} strokeWidth={2}><path d="M20 12H5M10.5 5.5 4 12l6.5 6.5" /></svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}><rect x="8.5" y="8.5" width="12" height="12" rx="2" /><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" /></svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}><path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" /><path d="M4 16.5v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
);
export const IconPlay = (p: P) => (
  <svg {...base(p)}><path d="M7 4.8v14.4L19.5 12 7 4.8Z" fill="currentColor" stroke="none" /></svg>
);
export const IconFast = (p: P) => (
  <svg {...base(p)}><path d="M13 2.5 4.5 13.5H11l-1 8L19.5 10H13l1-7.5Z" fill="currentColor" stroke="none" /></svg>
);
export const IconSkip = (p: P) => (
  <svg {...base(p)}><path d="M5 5v14l9-7-9-7Z" fill="currentColor" stroke="none" /><path d="M18 5v14" strokeWidth="2.2" /></svg>
);
export const IconRestart = (p: P) => (
  <svg {...base(p)}><path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3" /><path d="M4.5 17.5V12h5.5" /></svg>
);
export const IconTerminal = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="m7 9.5 3 2.7-3 2.8M12.5 15.5H17" /></svg>
);
export const IconBolt = (p: P) => (
  <svg {...base(p)}><path d="M13 2.5 4.5 13.5H11l-1 8L19.5 10H13l1-7.5Z" /></svg>
);
export const IconChip = (p: P) => (
  <svg {...base(p)}><rect x="7" y="7" width="10" height="10" rx="1.5" /><rect x="10" y="10" width="4" height="4" /><path d="M9.5 7V4M14.5 7V4M9.5 20v-3M14.5 20v-3M7 9.5H4M7 14.5H4M20 9.5h-3M20 14.5h-3" /></svg>
);
export const IconGauge = (p: P) => (
  <svg {...base(p)}><path d="M4 17a8.5 8.5 0 1 1 16 0" /><path d="M12 17 16 9.5" /><circle cx="12" cy="17" r="1.4" fill="currentColor" stroke="none" /></svg>
);
export const IconLayers = (p: P) => (
  <svg {...base(p)}><path d="m12 3.5 8.5 4.5L12 12.5 3.5 8 12 3.5Z" /><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" strokeWidth="1.4" /></svg>
);
export const IconDice = (p: P) => (
  <svg {...base(p)}><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9" cy="9" r="1.15" fill="currentColor" stroke="none" /><circle cx="15" cy="15" r="1.15" fill="currentColor" stroke="none" /><circle cx="15" cy="9" r="1.15" fill="currentColor" stroke="none" /><circle cx="9" cy="15" r="1.15" fill="currentColor" stroke="none" /></svg>
);
export const IconFlask = (p: P) => (
  <svg {...base(p)}><path d="M9.5 3.5h5M10.5 3.5v5.2L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3l-5.7-9.3V3.5" /><path d="M7.5 14.5h9" /></svg>
);
export const IconSpec = (p: P) => (
  <svg {...base(p)}><path d="M6 3.5h9L20 8.5v12H6v-17Z" /><path d="M15 3.5v5h5M9 12.5h7M9 16h5" /></svg>
);
export const IconSpark = (p: P) => (
  <svg {...base(p)}><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M18.7 5.3l-2.8 2.8M8.1 15.9l-2.8 2.8" /></svg>
);
