import React from "react";

const MASTER = new RegExp(
  [
    "(#.*)",
    "('''[\\s\\S]*?'''|\"\"\"[\\s\\S]*?\"\"\")",
    "([rbfRBF]{0,2}\"(?:\\\\.|[^\"\\\\\\n])*\"|[rbfRBF]{0,2}'(?:\\\\.|[^'\\\\\\n])*')",
    "(@[A-Za-z_][\\w.]*)",
    "\\b(def|class|return|if|elif|else|for|while|import|from|as|with|try|except|finally|raise|lambda|yield|pass|break|continue|and|or|not|in|is|None|True|False|global|assert|del)\\b",
    "\\b(self|cls)\\b",
    "\\b(print|len|range|enumerate|zip|map|filter|sorted|sum|min|max|abs|round|isinstance|dict|list|tuple|set|int|float|str|bool|open|super|property|staticmethod|classmethod|type|any|all|math)\\b",
    "(\\b\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)",
    "([A-Za-z_][A-Za-z0-9_]*)(?=\\()",
    "\\b([A-Z][A-Za-z0-9_]*)\\b",
  ].join("|"),
  "g"
);

const CLASS_BY_GROUP: Record<number, string> = {
  1: "text-[#54688a] italic",      // comment
  2: "text-[#8fd8a8]",             // triple string
  3: "text-[#8fd8a8]",             // string
  4: "text-rose",                  // decorator
  5: "text-amber",                 // keyword
  6: "text-sky italic",            // self
  7: "text-sky",                   // builtin
  8: "text-[#ff9db0]",             // number
  9: "text-aqua",                  // function call
  10: "text-[#ffd489]",            // ClassName
};

export function highlightPythonLine(line: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  MASTER.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MASTER.exec(line)) !== null) {
    if (m.index > last) out.push(<span key={key++}>{line.slice(last, m.index)}</span>);
    let cls = "";
    for (let g = 1; g <= 10; g++) {
      if (m[g] !== undefined) { cls = CLASS_BY_GROUP[g]; break; }
    }
    out.push(<span key={key++} className={cls}>{m[0]}</span>);
    last = m.index + m[0].length;
    if (m[0].length === 0) MASTER.lastIndex++;
  }
  if (last < line.length) out.push(<span key={key++}>{line.slice(last)}</span>);
  return out;
}

export function highlightJson(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    const parts: React.ReactNode[] = [];
    const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;
    let last = 0, k = 0, m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(<span key={k++}>{line.slice(last, m.index)}</span>);
      const cls = m[2] ? "text-aqua" : m[1] ? "text-[#8fd8a8]" : m[3] ? "text-[#ff9db0]" : "text-amber";
      parts.push(<span key={k++} className={cls}>{m[0]}</span>);
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(<span key={k++}>{line.slice(last)}</span>);
    return <React.Fragment key={i}>{i > 0 && "\n"}{parts}</React.Fragment>;
  });
}
