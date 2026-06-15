import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, ChevronLeft, CheckCircle2, XCircle,
  Clock, RotateCcw, ChevronDown, Loader2,
  AlertTriangle, Terminal, Lock, Play,
  PartyPopper, Code, ChevronRight, Eye, EyeOff,
} from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { id: 'python',     label: 'Python',     monacoLang: 'python' },
  { id: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
  { id: 'cpp',        label: 'C++',        monacoLang: 'cpp' },
  { id: 'java',       label: 'Java',       monacoLang: 'java' },
  { id: 'c',          label: 'C',          monacoLang: 'c' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  ACCEPTED:            { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2,  label: 'Accepted' },
  WRONG_ANSWER:        { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: XCircle,       label: 'Wrong Answer' },
  TIME_LIMIT_EXCEEDED: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: Clock,         label: 'Time Limit Exceeded' },
  COMPILE_ERROR:       { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: Terminal,      label: 'Compile Error' },
  RUNTIME_ERROR:       { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: AlertTriangle, label: 'Runtime Error' },
  PENDING:             { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    icon: Loader2,       label: 'Running...' },
};

const DIFFICULTY_CONFIG: Record<string, string> = {
  EASY:   'text-emerald-600 bg-emerald-50 border border-emerald-200',
  MEDIUM: 'text-amber-600 bg-amber-50 border border-amber-200',
  HARD:   'text-red-600 bg-red-50 border border-red-200',
};

interface TestCaseResult {
  passed: boolean;
  input: string | null;
  expected: string | null;
  output: string;
  error?: string;
}

// ── Result Panel (shared between Run and Submit) ──────────────────────────────
function ResultPanel({ result }: { result: any }) {
  const statusConfig = result ? STATUS_CONFIG[result.status] || STATUS_CONFIG.PENDING : null;

  let testResults: TestCaseResult[] | null = null;
  if (result?.output) {
    try {
      const parsed = JSON.parse(result.output);
      if (Array.isArray(parsed)) testResults = parsed;
    } catch { /* plain text */ }
  }
  // "Run" results come with testResults directly
  if (result?.testResults) testResults = result.testResults;

  const isRun = !!result?.isRun;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
          {isRun ? 'Run Results' : 'Submit Result'}
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Status banner */}
      {statusConfig && !isRun && (
        <div className={cn('flex items-center gap-2.5 px-4 py-3 rounded-xl border', statusConfig.bg, statusConfig.border)}>
          <statusConfig.icon className={cn('w-5 h-5 shrink-0', statusConfig.color, result.status === 'PENDING' && 'animate-spin')} />
          <span className={cn('text-sm font-bold', statusConfig.color)}>{statusConfig.label}</span>
          {result.testsPassed !== undefined && result.status !== 'PENDING' && (
            <span className="text-xs text-gray-400 ml-auto">{result.testsPassed}/{result.testsTotal} tests passed</span>
          )}
          {result.runtimeMs > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" /> {result.runtimeMs}ms
            </span>
          )}
        </div>
      )}

      {/* Run summary */}
      {isRun && (
        <div className={cn('flex items-center gap-2.5 px-4 py-3 rounded-xl border',
          result.testsPassed === result.testsTotal ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'
        )}>
          <Play className={cn('w-4 h-4', result.testsPassed === result.testsTotal ? 'text-emerald-400' : 'text-amber-400')} />
          <span className={cn('text-sm font-bold', result.testsPassed === result.testsTotal ? 'text-emerald-400' : 'text-amber-400')}>
            {result.testsPassed}/{result.testsTotal} visible tests passed
          </span>
        </div>
      )}

      {/* Pending */}
      {result?.status === 'PENDING' && (
        <div className="flex items-center gap-2 text-blue-400 text-sm p-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Executing your code...
        </div>
      )}

      {/* Per-test-case breakdown */}
      {testResults && result?.status !== 'PENDING' && (
        <div className="space-y-2">
          {testResults.map((tc, i) => (
            <div key={i} className={cn('rounded-xl border overflow-hidden', tc.passed ? 'border-emerald-500/30' : 'border-red-500/30')}>
              <div className={cn('flex items-center gap-2 px-3 py-1.5 text-xs font-semibold',
                tc.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              )}>
                {tc.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                Test Case {i + 1}
                {tc.input === null && (
                  <span className="ml-auto flex items-center gap-1 opacity-50 text-[10px] font-normal">
                    <Lock className="w-2.5 h-2.5" /> Hidden
                  </span>
                )}
              </div>
              <div className="p-3 space-y-1.5 font-mono text-xs bg-[#0d0d0d]">
                {tc.input !== null && (
                  <div className="flex gap-2">
                    <span className="text-zinc-500 shrink-0 w-16">Input:</span>
                    <span className="text-zinc-300 whitespace-pre break-all">{tc.input || '(none)'}</span>
                  </div>
                )}
                {tc.expected !== null && (
                  <div className="flex gap-2">
                    <span className="text-zinc-500 shrink-0 w-16">Expected:</span>
                    <span className="text-emerald-300 break-all">{tc.expected}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-zinc-500 shrink-0 w-16">Output:</span>
                  {tc.error
                    ? <span className="text-red-400 whitespace-pre-wrap break-all">{tc.error}</span>
                    : <span className={cn('break-all', tc.passed ? 'text-emerald-300' : 'text-red-300')}>
                        {tc.output || '(empty)'}
                      </span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback plain error */}
      {!testResults && result?.errorMsg && (
        <div className="rounded-xl overflow-hidden border border-red-500/30">
          <div className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-mono font-semibold">Error</div>
          <pre className="p-3 text-xs text-red-300 font-mono whitespace-pre-wrap bg-[#0d0d0d]">{result.errorMsg}</pre>
        </div>
      )}

      {result?.status === 'ACCEPTED' && (
        <div className="flex items-center gap-2 text-emerald-500 text-sm font-semibold py-1">
          <PartyPopper className="w-5 h-5" />
          All test cases passed!
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CodingProblemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState('python');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');
  const [result, setResult] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [leftWidth, setLeftWidth] = useState(42);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { data: problem, isLoading } = useQuery({
    queryKey: ['coding-problem', id],
    queryFn: () => api.get(`/coding/problems/${id}`).then(r => r.data.data),
  });

  const { data: submissions, refetch: refetchSubmissions } = useQuery({
    queryKey: ['my-submissions', id],
    queryFn: () => api.get(`/coding/problems/${id}/my-submissions`).then(r => r.data.data),
    enabled: activeTab === 'submissions',
  });

  useEffect(() => {
    if (problem?.starterCode) {
      const starter = problem.starterCode as Record<string, string>;
      setCode(starter[selectedLang] || `# Write your ${selectedLang} solution here\n`);
    }
  }, [problem, selectedLang]);

  const scrollToResult = () => setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);

  const submitMutation = useMutation({
    mutationFn: ({ code, language }: { code: string; language: string }) =>
      api.post(`/coding/problems/${id}/submit`, { code, language }).then(r => r.data.data),
    onSuccess: (data) => {
      setResult({ status: 'PENDING' });
      setIsPolling(true);
      scrollToResult();
      pollInterval.current = setInterval(async () => {
        try {
          const res = await api.get(`/coding/submissions/${data.submissionId}`);
          const sub = res.data.data;
          if (sub.status !== 'PENDING') {
            setResult(sub);
            setIsPolling(false);
            clearInterval(pollInterval.current!);
            refetchSubmissions();
          }
        } catch {
          setIsPolling(false);
          clearInterval(pollInterval.current!);
        }
      }, 1500);
    },
    onError: () => toast.error('Failed to submit code'),
  });

  const runMutation = useMutation({
    mutationFn: ({ code, language }: { code: string; language: string }) =>
      api.post(`/coding/problems/${id}/run`, { code, language }).then(r => r.data.data),
    onSuccess: (data) => {
      setResult(data); // already has testResults + isRun: true
      scrollToResult();
    },
    onError: () => toast.error('Failed to run code'),
  });

  useEffect(() => () => { if (pollInterval.current) clearInterval(pollInterval.current); }, []);

  const startDrag = (e: React.MouseEvent) => { isDragging.current = true; e.preventDefault(); };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const pct = ((e.clientX - containerRef.current.getBoundingClientRect().left) / containerRef.current.offsetWidth) * 100;
      setLeftWidth(Math.min(70, Math.max(25, pct)));
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const isExecuting = submitMutation.isPending || runMutation.isPending || isPolling;

  if (isLoading) return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );
  if (!problem) return (
    <div className="h-screen bg-gray-50 flex items-center justify-center text-gray-400">Problem not found</div>
  );

  const availableLangs = LANGUAGES.filter(l => problem.languages?.includes(l.id) || problem.languages?.length === 0);

  return (
    <div dir="ltr" className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">

      {/* ── Top bar (LIGHT) ──────────────────────────────────────── */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center gap-4 px-4 shrink-0 z-10 shadow-sm">
        <button
          onClick={() => navigate('/coding')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Problems
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-sm font-semibold text-gray-800 truncate">{problem.title}</span>
        <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-semibold ml-auto', DIFFICULTY_CONFIG[problem.difficulty])}>
          {problem.difficulty}
        </span>
      </header>

      {/* ── Main split pane ───────────────────────────────────────── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden select-none">

        {/* ── LEFT panel (LIGHT background, dark cards inside) ──── */}
        <div style={{ width: `${leftWidth}%` }} className="flex flex-col bg-gray-50 overflow-hidden border-r border-gray-200">

          {/* Tabs (LIGHT) */}
          <div className="flex border-b border-gray-200 shrink-0 px-2 bg-white">
            {(['problem', 'submissions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                )}
              >
                {tab === 'problem' ? 'Description' : 'My Submissions'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {activeTab === 'problem' ? (
              <>
                {/* Problem description — DARK card */}
                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-[#111]">
                  <div className="p-5 prose prose-invert prose-sm max-w-none text-zinc-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.description}</ReactMarkdown>
                  </div>
                </div>

                {/* Examples — DARK cards */}
                {(problem.testCases as any[]).filter(tc => !tc.isHidden).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-gray-700 font-bold text-sm px-1">Examples</h3>
                    {(problem.testCases as any[]).filter(tc => !tc.isHidden).map((tc: any, i: number) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-zinc-800">
                        <div className="bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500 font-mono font-medium">
                          Example {i + 1}
                        </div>
                        <div className="p-3 bg-[#0d0d0d] space-y-1.5 font-mono text-xs">
                          <div className="flex gap-2">
                            <span className="text-zinc-500 shrink-0">Input:</span>
                            <span className="text-zinc-200 whitespace-pre">{tc.input || '(none)'}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-zinc-500 shrink-0">Output:</span>
                            <span className="text-emerald-300">{tc.expectedOutput}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Results — appear here, dark cards */}
                {result && (
                  <div ref={resultRef}>
                    <ResultPanel result={result} />
                  </div>
                )}
              </>
            ) : (
              /* ── Submissions tab ── */
              <div className="space-y-2">
                {!submissions || submissions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">No submissions yet</div>
                ) : (
                  submissions.map((sub: any) => {
                    const cfg = STATUS_CONFIG[sub.status];
                    const Icon = cfg?.icon || CheckCircle2;
                    const isExpanded = expandedSub === sub.id;
                    return (
                      <div key={sub.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 p-3">
                          <Icon className={cn('w-4 h-4 shrink-0', cfg?.color)} />
                          <span className={cn('text-sm font-semibold', cfg?.color)}>{cfg?.label}</span>
                          <span className="text-gray-400 text-xs">{sub.language}</span>
                          <span className="text-gray-400 text-xs">{sub.testsPassed}/{sub.testsTotal}</span>
                          {sub.runtimeMs > 0 && (
                            <span className="flex items-center gap-1 text-gray-400 text-xs">
                              <Clock className="w-3 h-3" /> {sub.runtimeMs}ms
                            </span>
                          )}
                          <button
                            onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                            className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
                          >
                            {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {isExpanded ? 'Hide' : 'View'} Code
                          </button>
                        </div>
                        {isExpanded && sub.code && (
                          <div className="border-t border-gray-100">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900">
                              <Code className="w-3 h-3 text-zinc-500" />
                              <span className="text-xs text-zinc-500 font-mono">{sub.language}</span>
                            </div>
                            <pre className="p-4 text-xs font-mono text-zinc-200 bg-[#0d0d0d] overflow-x-auto whitespace-pre">
                              {sub.code}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Drag handle ──────────────────────────────────────────── */}
        <div
          onMouseDown={startDrag}
          className="w-1 bg-gray-200 hover:bg-primary-400 cursor-col-resize transition-colors shrink-0 active:bg-primary-500"
        />

        {/* ── RIGHT: Editor (toolbar LIGHT, editor stays dark) ───── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Toolbar (LIGHT) */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shrink-0 shadow-sm">
            {/* Language selector */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors font-medium">
                {LANGUAGES.find(l => l.id === selectedLang)?.label || selectedLang}
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 hidden group-focus-within:block group-hover:block min-w-[130px]">
                {availableLangs.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLang(lang.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm transition-colors',
                      selectedLang === lang.id ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                const starter = problem.starterCode as Record<string, string>;
                setCode(starter[selectedLang] || '');
              }}
              title="Reset code"
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex-1" />

            {/* Run button */}
            <button
              onClick={() => runMutation.mutate({ code, language: selectedLang })}
              disabled={isExecuting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run
            </button>

            {/* Submit button */}
            <button
              onClick={() => submitMutation.mutate({ code, language: selectedLang })}
              disabled={isExecuting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-500/20"
            >
              {(submitMutation.isPending || isPolling) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit
            </button>
          </div>

          {/* Monaco Editor — full height */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={LANGUAGES.find(l => l.id === selectedLang)?.monacoLang || 'python'}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
                lineNumbers: 'on',
                roundedSelection: true,
                cursorBlinking: 'smooth',
                renderWhitespace: 'selection',
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
