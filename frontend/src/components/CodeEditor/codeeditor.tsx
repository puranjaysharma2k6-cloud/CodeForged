import { useState, useRef, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";

import {ChevronLeft,  Code, Play, Terminal, Settings, CheckCircle, AlertCircle, BookOpen, HelpCircle } from "lucide-react";
import config from "../../config";
import { fetchwithAuth } from "../../Utils/fetchwithAuth";
import { useNavigate, useParams,useLocation } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── TYPES & CONSTANTS ────────────────────────────────────────────────────────

export type Lang = "cpp" | "javascript" | "typescript" | "python" | "java";

const SNIPS: Record<Lang, string> = {
  cpp:        `// C++\n#include <iostream>\n\nint main() {\n    std::cout << "Let him Cook\\n";\n    return 0;\n}`,
  javascript: `// JS\nconsole.log("Hello JS!");`,
  typescript: `// TS\nconst x: number = 42;\nconsole.log(x);`,
  python:     `# Python\nprint("Hello Python!")`,
  java:       `// Java\nclass Main {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}`
};

// ─── CUSTOM HOOK (logic only, no JSX) ─────────────────────────────────────────

function useCodeEditor() {
  const [lang, setLang] = useState<Lang>("cpp");
  const [code, setCode] = useState(SNIPS.cpp);
  const [run,  setRun]  = useState(false);
  const [logs, setLogs] = useState([{ text: "Console ready. Click 'Run Code'.", type: "info" }]);

  const handleLang = (l: Lang) => { setLang(l); setCode(SNIPS[l]); };
  const clear = () => setLogs([{ text: "Cleared.", type: "info" }]);

  const exec = () => {
    setRun(true);
    setLogs(p => [...p, { text: `> Running ${lang}...`, type: "info" }]);
    setTimeout(() => {
      try {
        if (lang === "python")    setLogs(p => [...p, { text: "Hello Python!", type: "stdout" }]);
        else if (lang === "cpp")  setLogs(p => [...p, { text: "Let him Cook",  type: "stdout" }]);
        else if (lang === "java") setLogs(p => [...p, { text: "Hello",         type: "stdout" }]);
        else {
          const out: string[] = [];
          new Function("console", code)({
            log: (...a: any[]) => out.push(a.map(x => typeof x === "object" ? JSON.stringify(x) : x).join(" "))
          });
          if (!out.length) setLogs(p => [...p, { text: "Success (no output).", type: "info" }]);
          else out.forEach(text => setLogs(p => [...p, { text, type: "stdout" }]));
        }
      } catch (e: any) {
        setLogs(p => [...p, { text: e.message || "Error", type: "stderr" }]);
      }
      setRun(false);
    }, 600);
  };

  return { lang, handleLang, code, setCode, run, logs, exec, clear };
}

// ─── RESIZER ─────────────────────────────────────────────────────────────────

interface ResizerProps {
  direction: "h" | "v";   // h = vertical bar (horizontal resize), v = horizontal bar (vertical resize)
  onDrag: (delta: number) => void;
}

function Resizer({ direction, onDrag }: ResizerProps) {
  const isDragging = useRef(false);
  const lastPos    = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    lastPos.current = direction === "h" ? e.clientX : e.clientY;

    // Lock cursor and disable text selection globally while dragging
    document.body.style.userSelect = "none";
    document.body.style.cursor = direction === "h" ? "col-resize" : "row-resize";

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const pos   = direction === "h" ? e.clientX : e.clientY;
      const delta = pos - lastPos.current;
      lastPos.current = pos;
      onDrag(delta);
    };

    const onUp = () => {
      isDragging.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  };

  // Grip dots — 5 dots in a line along the drag axis
  const dots = Array.from({ length: 5 });

  return direction === "h" ? (
    // Vertical bar between columns — triggers horizontal resize
    <div
      onMouseDown={onMouseDown}
      className="w-3 shrink-0 flex items-center justify-center cursor-col-resize group"
    >
      <div className="w-[3px] h-full rounded-full bg-slate-800 group-hover:bg-blue-500/60 transition-colors duration-150 flex flex-col items-center justify-center gap-[4px]">
        {dots.map((_, i) => (
          <div key={i} className="w-[3px] h-[3px] rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors" />
        ))}
      </div>
    </div>
  ) : (
    // Horizontal bar between editor and output — triggers vertical resize
    <div
      onMouseDown={onMouseDown}
      className="h-3 shrink-0 flex items-center justify-center cursor-row-resize group"
    >
      <div className="h-[3px] w-full rounded-full bg-slate-800 group-hover:bg-blue-500/60 transition-colors duration-150 flex items-center justify-center gap-[4px]">
        {dots.map((_, i) => (
          <div key={i} className="w-[3px] h-[3px] rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors" />
        ))}
      </div>
    </div>
  );
}

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="w-[18px] h-[18px] rounded-full border-2 border-current border-t-transparent animate-spin" />
);

// className is forwarded so the parent can set height/flex constraints
const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden ${className}`}>
    {children}
  </div>
);

const PanelBar = ({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0 min-h-[60px]">
    <div className="flex items-center gap-2.5 text-zinc-300 text-base font-semibold uppercase tracking-widest">
      {left}
    </div>
    {right && (
      <div className="flex items-center gap-3">
        {right}
      </div>
    )}
  </div>
);

// ─── FEATURE COMPONENTS ───────────────────────────────────────────────────────

const Header = () => {
  const navigate = useNavigate(); 

  return (
    <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-6 border-b border-slate-800 shrink-0">
      
      <div 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-4 cursor-pointer group select-none"
        title="Go Back"
      >
       
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 group-hover:bg-blue-500/20 group-hover:border-blue-500/60 transition-all duration-150">
          <Code size={30} />
        </div>
        <div>
          <p className="text-white font-bold text-xl leading-tight group-hover:text-blue-400 transition-colors duration-150">
            CodeForged
          </p>
          {/* Subtle micro-interaction label showing it acts as a back navigation link */}
          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-0.5 group-hover:text-zinc-400 transition-colors">
            <ChevronLeft size={14} className="transform group-hover:-translate-x-0.5 transition-transform" /> 
            Back to Arena
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-emerald-400 border border-emerald-500/40 rounded-full px-4 py-1.5 font-medium">
        <CheckCircle size={16} />
        Type-Safe Console
      </div>
    </div>
  );
};

// Panels accept className so the resize containers can control height
const EditorPanel = ({ lang, code, onSel, onCode, className = "" }: {
  lang: Lang; code: string;
  onSel: (l: Lang) => void; onCode: (c: string) => void;
  className?: string;
}) => (
  <Panel className={`h-full ${className}`}>
    <PanelBar
      left={
        <select
          value={lang}
          onChange={e => onSel(e.target.value as Lang)}
          className="bg-slate-800 text-white text-sm font-bold uppercase px-4 py-3 rounded-lg border border-slate-700 outline-none cursor-pointer tracking-wider"
        >
          {(Object.keys(SNIPS) as Lang[]).map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      }
      right={
        <span className="flex items-center gap-2 text-zinc-500 text-sm font-normal normal-case tracking-normal">
          <Settings size={18} /> Dark Theme
        </span>
      }
    />
    <div className="flex flex-1 overflow-hidden min-h-0">
      
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={lang}
          value={code}
          onChange={value => onCode(value ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: "on",
            padding: { top: 18, bottom: 18 },
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          }}
        />
      </div>
    </div>
  </Panel>
);

const OutputPanel = ({ logs, run, exec, clear, className = "" }: {
  logs: { text: string; type: string }[];
  run: boolean; exec: () => void; clear: () => void;
  className?: string;
}) => (
  <Panel className={`h-full ${className}`}>
    <PanelBar
      left={<><Terminal size={22} className="text-blue-500" /> Execution Output</>}
      right={
        <>
          <button
            onClick={clear}
            className="text-zinc-400 text-sm font-medium px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={exec}
            disabled={run}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold h-10 px-5 py-3 rounded-lg transition-colors"
          >
            {run ? <Spinner /> : <Play size={17} />}
            {run ? "Running" : "Run Code"}
          </button>
        </>
      }
    />
    <div className="flex-1 overflow-auto px-6 py-5 font-mono text-sm flex flex-col gap-2.5 leading-6 min-h-0">
      {logs.map((l, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 ${
            l.type === "stdout" ? "text-emerald-400" :
            l.type === "stderr" ? "text-rose-400"    :
            "text-zinc-500 italic"
          }`}
        >
          {l.type === "stderr" && <AlertCircle size={16} />}
          {l.text}
        </div>
      ))}
    </div>
  </Panel>
);

const ProblemPanel = ({ problem, loading, error, className = "" }: {
  problem: { title: string; content: string } | null;
  loading: boolean;
  error: string | null;
  className?: string;
}) => (
  <Panel className={`h-full ${className}`}>
    <PanelBar
      left={<><BookOpen size={22} className="text-blue-500" /> Problem Description</>}
      right={
        <span className="flex items-center gap-2 text-zinc-500 text-sm font-normal normal-case tracking-normal">
          <HelpCircle size={18} /> API Endpoint Data
        </span>
      }
    />
    <div className="flex-1 min-h-0 px-8 py-6 overflow-y-auto arena-scroll text-zinc-300">
      {loading ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-500">
          <Spinner />
          <p className="text-sm">Loading problem details from API...</p>
        </div>
      ) : error ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-rose-400">
          <p className="font-semibold">Failed to load problem</p>
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      ) : problem ? (
        <div className="flex flex-col gap-4">
      
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            {problem.title}
          </h1>
          
          <hr className="border-slate-800 my-2" />

          {/*  Markdown Core Renderer */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings
              h1: ({ node, ...props }) => <h1 className="text-2xl font-extrabold text-white mt-6 mb-3 tracking-tight" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-white mt-5 mb-2 tracking-wide" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-md font-bold uppercase tracking-wider text-[#22d3ee] mt-4 mb-2" {...props} />,
              
              // Text Paragraphs
              p: ({ node, ...props }) => <p className="text-sm leading-7 text-zinc-300 mb-4" {...props} />,
              
              
              ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-sm text-zinc-300" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-sm text-zinc-300" {...props} />,
              li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
              
             
              code: ({ node, className, children, ...props }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 my-3 overflow-x-auto font-mono text-xs text-emerald-400 leading-relaxed">
                    <code {...props}>{children}</code>
                  </pre>
                );
              },
              

              hr: ({ node, ...props }) => <hr className="border-slate-800 my-6" {...props} />,
              
  
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-blue-500 bg-blue-500/5 pl-4 py-2 my-4 italic text-zinc-400 rounded-r-lg" {...props} />
              ),
            }}
          >
            {problem.content}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-400">
          <p className="text-sm">No problem data loaded yet.</p>
        </div>
      )}
    </div>
  </Panel>
);

// ROOT 

export default function App() {
  const state = useCodeEditor();
  const navigate = useNavigate();
  const location = useLocation();
  const { contestId } = useParams();
  

  const problem = location.state?.problemData;

  const [leftPct,   setLeftPct]   = useState(55);
  const [editorPct, setEditorPct] = useState(65);

  const containerRef = useRef<HTMLDivElement>(null); 
  const leftColRef   = useRef<HTMLDivElement>(null); 

  useEffect(() => {
     //console.log(problem);
    if (!problem) {
      navigate(`/contests/${contestId}`);
    }
  }, [problem, navigate, contestId]);
  

  if (!problem) return null; 

  const onHorizontalDrag = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const totalW  = containerRef.current.offsetWidth;
    const deltaPct = (delta / totalW) * 100;
    setLeftPct(prev => Math.min(Math.max(prev + deltaPct, 25), 75));
  }, []);

  const onVerticalDrag = useCallback((delta: number) => {
    if (!leftColRef.current) return;
    const totalH   = leftColRef.current.offsetHeight;
    const deltaPct = (delta / totalH) * 100;
    setEditorPct(prev => Math.min(Math.max(prev + deltaPct, 20), 80));
  }, []);

  return (
    <div className="bg-[#090d16] text-white font-sans">
       <div className="flex justify-center"> 
        <div className="px-10 py-6 flex flex-col h-[calc(99vh-60px)] w-[calc(100vw-12px)]">

        <Header />

        <div ref={containerRef} className="flex flex-1 min-h-0">

          <div
            ref={leftColRef}
            className="flex flex-col min-w-0 min-h-0"
            style={{ width: `${leftPct}%` }}
          >
            <div style={{ height: `${editorPct}%` }} className="min-h-0">
              <EditorPanel
                lang={state.lang}
                code={state.code}
                onSel={state.handleLang}
                onCode={state.setCode}
              />
            </div>

            <Resizer direction="v" onDrag={onVerticalDrag} />

            <div className="flex-1 min-h-0">
              <OutputPanel logs={state.logs} run={state.run} exec={state.exec} clear={state.clear} />
            </div>
          </div>
          
          <Resizer direction="h" onDrag={onHorizontalDrag} />

          <div className="flex-1 min-w-0 min-h-0">
            
            <ProblemPanel
              problem={{
                title: problem.title,
                
                content: problem.statement 
              }}
              loading={false} 
              error={null}
            />
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}