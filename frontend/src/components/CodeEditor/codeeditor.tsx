import { useState, useRef, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  ChevronLeft, Play, Terminal, AlertCircle,
  FlaskConical, Code2, RotateCcw, Clock, Cpu,
  AlignLeft, BookOpen, Maximize2, ChevronUp,
} from "lucide-react";
import config from "../../config";
import { fetchwithAuth } from "../../Utils/fetchwithAuth";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ArenaProblem, ContestOutletContext } from "../../layouts/ContestLayout";
import PanelCard from "./PanelCard";



export type Lang = "cpp" | "javascript" | "python" | "java";

interface LangMeta { label: string; monacoId: string; color: string; }

const LANG_META: Record<Lang, LangMeta> = {
  cpp:        { label: "C++",        monacoId: "cpp",        color: "#60a5fa" },
  javascript: { label: "JavaScript", monacoId: "javascript", color: "#fbbf24" },
  python:     { label: "Python",     monacoId: "python",     color: "#34d399" },
  java:       { label: "Java",       monacoId: "java",       color: "#f97316" },
};

const SNIPS: Record<Lang, string> = {
  cpp:
`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    return 0;
}`,
  javascript: `// JavaScript\n`,
  python:     `import sys\ninput = sys.stdin.readline\n\n`,
  java:
`import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        
    }
}`,
};


const CONSOLE_HEIGHT = 220;


function useCodeEditor(onSubmitted?: (id: string) => void) {
  const [lang, setLang]             = useState<Lang>("cpp");
  const [code, setCodeState]        = useState(SNIPS.cpp);
  const [run,  setRun]              = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs]             = useState([{ text: "Console ready.", type: "info" }]);
  const codeRef                     = useRef(SNIPS.cpp);

  const setCode = (v: string) => { setCodeState(v); codeRef.current = v; };
  const changeLang = (l: Lang) => { setLang(l); setCode(SNIPS[l]); };
  const clear = () => setLogs([{ text: "Cleared.", type: "info" }]);

  const appendVerdict = useCallback((payload: any) => {
    const v = payload.verdict ?? "UNKNOWN";
    setSubmitting(false);
    setLogs(prev => [...prev, {
      text: (v === "ACCEPTED" ? "✅ Accepted" : `⚠️ ${v.replace(/_/g, " ")}`) + `  ·  ${payload.submissionId}`,
      type: v === "ACCEPTED" ? "stdout" : "stderr",
    }]);
  }, []);

  const exec = () => {
    setRun(true);
    setLogs(p => [...p, { text: `▶  Running ${LANG_META[lang].label}…`, type: "info" }]);
    const cur = codeRef.current;
    setTimeout(() => {
      try {
        if (lang === "python")    setLogs(p => [...p, { text: "Hello Python!", type: "stdout" }]);
        else if (lang === "cpp")  setLogs(p => [...p, { text: "Let him Cook", type: "stdout" }]);
        else if (lang === "java") setLogs(p => [...p, { text: "Hello", type: "stdout" }]);
        else {
          const out: string[] = [];
          new Function("console", cur)({ log: (...a: any[]) => out.push(a.join(" ")) });
          out.length
            ? out.forEach(t => setLogs(p => [...p, { text: t, type: "stdout" }]))
            : setLogs(p => [...p, { text: "Success (no output).", type: "info" }]);
        }
      } catch (e: any) { setLogs(p => [...p, { text: e.message, type: "stderr" }]); }
      setRun(false);
    }, 600);
  };

  const submitCode = useCallback(async (contestId?: string, problemId?: string) => {
    if (!contestId || !problemId) { setLogs(p => [...p, { text: "Missing context.", type: "stderr" }]); return; }
    if (!codeRef.current.trim())  { setLogs(p => [...p, { text: "Editor is empty.", type: "stderr" }]); return; }
    setSubmitting(true);
    setLogs(p => [...p, { text: ` Submitting ${LANG_META[lang].label}…`, type: "info" }]);
    try {
      const res  = await fetchwithAuth(
        `${config.apiUrl}/api/contests/${contestId}/problems/${problemId}/submit`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceCode: codeRef.current, language: lang }) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Submission failed");
      onSubmitted?.(data.submissionId);
      setLogs(p => [...p, { text: `Queued · id: ${data.submissionId}`, type: "stdout" }]);
      setLogs(p => [...p, { text: "⏳  Waiting for verdict…", type: "info" }]);
    } catch (e: any) {
      setSubmitting(false);
      setLogs(p => [...p, { text: e.message || "Submission failed", type: "stderr" }]);
    }
  }, [lang, onSubmitted]);

  return { lang, changeLang, code, setCode, run, submitting, logs, exec, clear, submitCode, appendVerdict };
}


const Spinner = ({ size = 16 }: { size?: number }) => (
  <svg style={{ width: size, height: size }} className="animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);



function LangSelector({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const meta = LANG_META[lang];
  return (
    <div className="relative">
      <select
        value={lang}
        onChange={e => onChange(e.target.value as Lang)}
        className="h-9 pl-3 pr-8 rounded-lg bg-[#1a1f2e] border border-[#2e3448]
          hover:border-[#4a5168] text-sm font-semibold text-white appearance-none
          cursor-pointer transition-colors duration-150 outline-none focus:border-blue-500"
        style={{ color: meta.color }}
      >
        {(Object.entries(LANG_META) as [Lang, LangMeta][]).map(([key, m]) => (
          <option key={key} value={key} style={{ color: m.color, backgroundColor: "#111420" }}>
            {m.label}
          </option>
        ))}
      </select>
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
        ▾
      </span>
    </div>
  );
}


function TopBar({ problem, idx, contestId }: {
  problem: ArenaProblem; idx: number; contestId: string;
}) {
  const navigate = useNavigate();
  const letter   = String.fromCharCode(65 + idx);
  const diffColor =
    problem.difficulty === "Easy"   ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
    problem.difficulty === "Medium" ? "text-amber-400   bg-amber-400/10   border-amber-400/20"   :
    problem.difficulty === "Hard"   ? "text-rose-400    bg-rose-400/10    border-rose-400/20"    : "";

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6
      bg-[#0d1117] border-b border-[#1e2434] select-none z-20">

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/contests/${contestId}`)}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white
            text-sm font-medium transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Arena
        </button>

        <span className="text-[#2e3448]">/</span>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center h-7 w-7 rounded-md
            bg-blue-500/15 text-blue-400 text-sm font-bold">{letter}</span>
          <span className="text-white text-sm font-semibold truncate max-w-xs">
            {problem.title}
          </span>
          {problem.difficulty && diffColor && (
            <span className={`hidden sm:inline-flex items-center h-5 px-2 rounded border
              text-[10px] font-bold uppercase tracking-wide ${diffColor}`}>
              {problem.difficulty}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5 text-sm text-zinc-500">
        {problem.timeLimit   && <span className="flex items-center gap-1.5"><Clock size={13} />{problem.timeLimit / 1000}s</span>}
        {problem.memoryLimit && <span className="flex items-center gap-1.5"><Cpu   size={13} />{problem.memoryLimit} MB</span>}
      </div>
    </header>
  );
}


function ProblemPanel({ problem }: { problem: { title: string; content: string } | null }) {
  return (
    <PanelCard
      className="h-full"
      header={<>
        <span className="flex items-center gap-2.5 text-base font-bold uppercase tracking-widest text-violet-400">
          <AlignLeft size={15} />Problem
        </span>
        <button className="flex items-center justify-center h-8 w-8 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-[#1a1f2e] transition-colors">
          <Maximize2 size={15} />
        </button>
      </>}
      bodyClassName="px-6 py-5 text-zinc-300"
    >
      {problem ? (
        <div className="max-w-2xl flex flex-col gap-3">
          <h1 className="text-xl font-bold text-white tracking-tight">{problem.title}</h1>
          <hr className="border-[#1e2434]" />
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ ...p }) => <h1 className="text-lg font-bold text-white mt-6 mb-2" {...p} />,
              h2: ({ ...p }) => <h2 className="text-base font-bold text-white mt-5 mb-2 uppercase tracking-wide" {...p} />,
              h3: ({ ...p }) => <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mt-4 mb-1" {...p} />,
              p:  ({ ...p }) => <p className="text-[15px] leading-7 text-zinc-300 mb-3" {...p} />,
              ul: ({ ...p }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-[15px] text-zinc-300" {...p} />,
              ol: ({ ...p }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-[15px] text-zinc-300" {...p} />,
              li: ({ ...p }) => <li className="leading-relaxed" {...p} />,
              strong: ({ ...p }) => <strong className="font-semibold text-white" {...p} />,
              code: ({ className: cls, children, ...p }) => !cls
                ? <code className="bg-[#1a1f2e] text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono" {...p}>{children}</code>
                : <pre className="bg-[#1a1f2e] border border-[#2e3448] rounded-lg p-4 my-3 overflow-x-auto font-mono text-sm text-emerald-300 leading-relaxed"><code {...p}>{children}</code></pre>,
              hr:         ({ ...p }) => <hr className="border-[#1e2434] my-5" {...p} />,
              blockquote: ({ ...p }) => <blockquote className="border-l-2 border-blue-500 bg-blue-500/5 pl-4 py-1 my-3 italic text-zinc-400 rounded-r text-sm" {...p} />,
              table: ({ ...p }) => <div className="overflow-x-auto my-4"><table className="w-full text-sm border-collapse" {...p} /></div>,
              th: ({ ...p }) => <th className="border border-[#1e2434] px-3 py-2 text-left text-sm font-bold text-zinc-300 bg-[#1a1f2e]" {...p} />,
              td: ({ ...p }) => <td className="border border-[#1e2434] px-3 py-2 text-sm text-zinc-400" {...p} />,
            }}
          >
            {problem.content}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-zinc-600">
          <div className="flex flex-col items-center gap-3">
            <BookOpen size={28} /><span className="text-sm">No problem loaded</span>
          </div>
        </div>
      )}
    </PanelCard>
  );
}




function EditorColumn({ lang, code, onLang, onCode, onReset, logs, run, submitting, onExec, onClear, onSubmit }: {
  lang: Lang; code: string;
  onLang: (l: Lang) => void; onCode: (c: string) => void; onReset: () => void;
  logs: { text: string; type: string }[];
  run: boolean; submitting: boolean;
  onExec: () => void; onClear: () => void; onSubmit: () => void;
}) {
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleH, setConsoleH]       = useState(CONSOLE_HEIGHT);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const onVDrag = useCallback((delta: number) => {
    setConsoleH(prev => Math.min(Math.max(prev - delta, 120), 520));
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">

      {/*EDITOR PANEL */}
      <PanelCard
        className="min-h-0"
        style={{ flex: 1, minHeight: 0 }}
        noScroll
        header={<>
          <span className="flex items-center gap-2.5 text-base font-bold uppercase tracking-widest text-blue-400 shrink-0">
            <Code2 size={15} />Code Editor
          </span>
          <div className="flex items-center gap-2" style={{ overflow: "visible" }}>
            <LangSelector lang={lang} onChange={onLang} />
            <button
              onClick={onReset}
              title="Reset to template"
              className="flex items-center justify-center h-9 w-9 rounded-lg text-zinc-500 hover:text-white hover:bg-[#1a1f2e] border border-transparent hover:border-[#2e3448] transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </>}
      >
        <Editor
          height="100%"
          language={LANG_META[lang].monacoId}
          value={code}
          onChange={v => onCode(v ?? "")}
          theme="vs-dark"
          options={{
            minimap:              { enabled: false },
            fontSize:             14,
            lineHeight:           22,
            wordWrap:             "off",
            scrollBeyondLastLine: false,
            automaticLayout:      true,
            lineNumbers:          "on",
            renderLineHighlight:  "line",
            padding:              { top: 16, bottom: 16 },
            fontFamily:           "'JetBrains Mono','Fira Code',ui-monospace,monospace",
            fontLigatures:        true,
            cursorBlinking:       "smooth",
            smoothScrolling:      true,
            scrollbar:            { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
          }}
        />
      </PanelCard>

      <VResizer onDrag={onVDrag} />
  {/* console panel */}
      <PanelCard
        className="shrink-0"
        style={{ height: consoleOpen ? consoleH : 48 }}
        noScroll
        header={<>
          <button
            onClick={() => setConsoleOpen(o => !o)}
            className="flex items-center gap-2.5 text-base font-bold uppercase tracking-widest text-emerald-400 select-none group"
          >
            <Terminal size={15} className="shrink-0" />
            Output
            <ChevronUp size={14} className={`text-zinc-500 transition-transform duration-200 ${consoleOpen ? "" : "rotate-180"}`} />
          </button>
          <div className="flex items-center gap-2.5">
            <button onClick={onClear} className="h-9 px-5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-[#1a1f2e] border border-[#2e3448] hover:border-[#4a5168] transition-colors whitespace-nowrap">
              Clear
            </button>
            <button onClick={onSubmit} disabled={submitting} className="flex items-center gap-2 h-9 px-6 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors whitespace-nowrap">
              {submitting ? <Spinner size={14} /> : <FlaskConical size={14} />}Submit
            </button>
            <button onClick={onExec} disabled={run} className="flex items-center gap-2 h-9 px-6 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors whitespace-nowrap">
              {run ? <Spinner size={14} /> : <Play size={14} />}{run ? "Running…" : "Run Code"}
            </button>
          </div>
        </>}
      >
        {consoleOpen && (
          <div className="h-full overflow-y-auto px-5 py-3 font-mono text-sm leading-6 flex flex-col gap-1.5 [scrollbar-width:thin] [scrollbar-color:#2e3448_transparent]">
            {logs.map((l, i) => (
              <div key={i} className={`flex items-start gap-2 ${
                l.type === "stdout" ? "text-emerald-400" :
                l.type === "stderr" ? "text-rose-400"    : "text-zinc-500"
              }`}>
                {l.type === "stderr" && <AlertCircle size={13} className="mt-0.5 shrink-0" />}
                <span className="whitespace-pre-wrap break-all">{l.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </PanelCard>
    </div>
  );
}

function VResizer({ onDrag }: { onDrag: (d: number) => void }) {
  const lastY = useRef(0);

  return (
    <div
      className="h-3 shrink-0 flex items-center justify-center cursor-row-resize group"
      onPointerDown={e => { e.preventDefault(); lastY.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { if (!e.buttons) return; onDrag(e.clientY - lastY.current); lastY.current = e.clientY; }}
    >
      <div className="h-px w-full bg-[#1e2434] group-hover:bg-blue-500/60 transition-colors" />
    </div>
  );
}

function HResizer({ onDrag }: { onDrag: (d: number) => void }) {
  const lastX = useRef(0);

  return (
    <div
      className="w-3 shrink-0 flex items-center justify-center cursor-col-resize group"
      onPointerDown={e => { e.preventDefault(); lastX.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { if (!e.buttons) return; onDrag(e.clientX - lastX.current); lastX.current = e.clientX; }}
    >
      <div className="w-px h-full bg-[#1e2434] group-hover:bg-blue-500/50 transition-colors" />
    </div>
  );
}


export default function CodeEditor() {
  const socketRef  = useRef<WebSocket | null>(null);
  const pendingRef = useRef<string[]>([]);

  const subscribeToSubmission = useCallback((id: string) => {
    if (!id) return;
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "subscribe", submissionId: id, lastId: "0" }));
      return;
    }
    pendingRef.current.push(id);
  }, []);

  const state = useCodeEditor(subscribeToSubmission);

  // Verdict WebSocket
  useEffect(() => {
    const ws = new WebSocket(`${config.apiUrl.replace(/^http/, "ws")}/ws/verdict`);
    socketRef.current = ws;
    ws.onopen = () => {
      pendingRef.current.splice(0).forEach(id =>
        ws.send(JSON.stringify({ type: "subscribe", submissionId: id, lastId: "0" }))
      );
    };
    ws.onmessage = ({ data }) => {
      try { const p = JSON.parse(data); if (p.type === "verdict") state.appendVerdict(p); } catch { /* ignore */ }
    };
    ws.onerror = e => console.error("WS error", e);
    return () => ws.close();
  }, [state.appendVerdict]);

  const navigate = useNavigate();
  const location = useLocation();
  const { contestId, problemId } = useParams();
  const { problems, loading, error } = useOutletContext<ContestOutletContext>();

  const problemFromNav = location.state?.problemData as ArenaProblem | undefined;
  const problem        = problemFromNav ?? problems.find(({ id }) => id === problemId);
  const problemIndex   = problems.findIndex(({ id }) => id === problem?.id);

  const [leftPct, setLeftPct] = useState(40);
  const containerRef = useRef<HTMLDivElement>(null);

  const onHDrag = useCallback((delta: number) => {
    const w = containerRef.current?.offsetWidth ?? window.innerWidth;
    setLeftPct(prev => Math.min(Math.max(prev + (delta / w) * 100, 20), 65));
  }, []);

  useEffect(() => {
    if (!loading && !error && !problem) navigate(`/contests/${contestId}`);
  }, [contestId, error, loading, navigate, problem]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#080c14]">
      <Spinner size={32} />
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-[#080c14] text-rose-400 text-sm">
      {error}
    </div>
  );

  if (!problem) return null;

  return (
    <div className="flex flex-col h-screen bg-[#080c14] text-white overflow-hidden">

      {/* Global top bar */}
      <TopBar
        problem={problem}
        idx={Math.max(problemIndex, 0)}
        contestId={contestId ?? ""}
      />

      {/* Main two-column area — p-4 gives 16px gap from screen edges on all sides */}
      <div ref={containerRef} className="flex flex-1 min-h-0 p-4">

        {/* Left — problem description */}
        <div className="min-h-0" style={{ width: `${leftPct}%` }}>
          <ProblemPanel problem={{ title: problem.title, content: problem.statement }} />
        </div>

        {/* Drag handle */}
        <HResizer onDrag={onHDrag} />

        {/* Right — editor + console drawer */}
        <div className="flex-1 min-w-0 min-h-0">
          <EditorColumn
            lang={state.lang}
            code={state.code}
            onLang={state.changeLang}
            onCode={state.setCode}
            onReset={() => state.setCode(SNIPS[state.lang])}
            logs={state.logs}
            run={state.run}
            submitting={state.submitting}
            onExec={state.exec}
            onClear={state.clear}
            onSubmit={() => void state.submitCode(contestId, problem?.id)}
          />
        </div>

      </div>
    </div>
  );
}
