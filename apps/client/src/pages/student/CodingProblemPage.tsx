import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, ChevronLeft, CheckCircle2, XCircle,
  Clock, RotateCcw, ChevronDown, Loader2,
  AlertTriangle, Terminal, Lock,
} from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { id: 'python', label: 'Python', monacoLang: 'python' },
  { id: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
  { id: 'cpp', label: 'C++', monacoLang: 'cpp' },
  { id: 'java', label: 'Java', monacoLang: 'java' },
  { id: 'c', label: 'C', monacoLang: 'c' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  ACCEPTED:           { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2, label: 'Accepted' },
  WRONG_ANSWER:       { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: XCircle,      label: 'Wrong Answer' },
  TIME_LIMIT_EXCEEDED:{ color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: Clock,        label: 'Time Limit Exceeded' },
  COMPILE_ERROR:      { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: Terminal,     label: 'Compile Error' },
  RUNTIME_ERROR:      { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: AlertTriangle,label: 'Runtime Error' },
  PENDING:            { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    icon: Loader2,      label: 'Running...' },
};

const DIFFICULTY_CONFIG: Record<string, string> = {
  EASY:   'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
  HARD:   'text-red-400 bg-red-500/10 border border-red-500/20',
};

interface TestCaseResult {
  passed: boolean;
  input: string | null;
  expected: string | null;
  output: string;
  error?: string;
}

export default function CodingProblemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState('python');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');
  const [result, setResult] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
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

  const submitMutation = useMutation({
    mutationFn: ({ code, language }: { code: string; language: string }) =>
      api.post(`/coding/problems/${id}/submit`, { code, language }).then(r => r.data.data),
    onSuccess: (data) => {
      setResult({ status: 'PENDING' });
      setIsPolling(true);
      // Scroll results into view on left panel
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
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

  useEffect(() => () => { if (pollInterval.current) clearInterval(pollInterval.current); }, []);

  // Drag resize
  const startDrag = (e: React.MouseEvent) => {
    isDragging.current = true;
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(70, Math.max(25, pct)));
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-screen bg-[#0d0d0d] flex items-center justify-center text-zinc-400">
        Problem not found
      </div>
    );
  }

  const availableLangs = LANGUAGES.filter(l => problem.languages?.includes(l.id) || problem.languages?.length === 0);
  const statusConfig = result ? STATUS_CONFIG[result.status] || STATUS_CONFIG.PENDING : null;

  // Parse per-test-case results from JSON output
  let testResults: TestCaseResult[] | null = null;
  if (result?.output) {
    try {
      const parsed = JSON.parse(result.output);
      if (Array.isArray(parsed)) testResults = parsed;
    } catch { /* plain text */ }
  }

  return (
    <div dir="ltr" className="flex flex-col h-screen bg-[#0d0d0d] overflow-hidden font-sans">

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className="h-12 bg-[#161616] border-b border-zinc-800 flex items-center gap-4 px-4 shrink-0 z-10">
        <button
          onClick={() => navigate('/coding')}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Problems
        </button>
        <div className="h-4 w-px bg-zinc-700" />
        <span className="text-sm font-semibold text-zinc-50 truncate">{problem.title}</span>
        <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-semibold ml-auto', DIFFICULTY_CONFIG[problem.difficulty])}>
          {problem.difficulty}
        </span>
      </header>

      {/* ── Main split pane ───────────────────────────────────────── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden select-none">

        {/* ── LEFT: Problem description + Examples + Results ───── */}
        <div style={{ width: `${leftWidth}%` }} className="flex flex-col bg-[#0d0d0d] overflow-hidden border-r border-zinc-800">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 shrink-0 px-2">
            {(['problem', 'submissions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-200'
                )}
              >
                {tab === 'problem' ? 'Description' : 'My Submissions'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === 'problem' ? (
              <>
                {/* Description */}
                <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {problem.description}
                  </ReactMarkdown>
                </div>

                {/* Examples */}
                {(problem.testCases as any[]).filter(tc => !tc.isHidden).length > 0 && (
                  <div>
                    <h3 className="text-zinc-200 font-bold text-sm mb-3">Examples</h3>
                    <div className="space-y-3">
                      {(problem.testCases as any[])
                        .filter(tc => !tc.isHidden)
                        .map((tc: any, i: number) => (
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
                  </div>
                )}

                {/* ── Results (appear here after submit) ── */}
                {result && (
                  <div ref={resultRef} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-zinc-800" />
                      <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">Result</span>
                      <div className="h-px flex-1 bg-zinc-800" />
                    </div>

                    {/* Status banner */}
                    {statusConfig && (
                      <div className={cn('flex items-center gap-2.5 px-4 py-3 rounded-xl border', statusConfig.bg, statusConfig.border)}>
                        <statusConfig.icon className={cn('w-5 h-5 shrink-0', statusConfig.color, result.status === 'PENDING' && 'animate-spin')} />
                        <span className={cn('text-sm font-bold', statusConfig.color)}>{statusConfig.label}</span>
                        {result.testsPassed !== undefined && result.status !== 'PENDING' && (
                          <span className="text-xs text-zinc-500 ml-auto">
                            {result.testsPassed}/{result.testsTotal} tests passed
                          </span>
                        )}
                        {result.runtimeMs > 0 && (
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <Clock className="w-3 h-3" /> {result.runtimeMs}ms
                          </span>
                        )}
                      </div>
                    )}

                    {/* Running spinner */}
                    {result.status === 'PENDING' && (
                      <div className="flex items-center gap-2 text-blue-400 text-sm p-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Executing your code...
                      </div>
                    )}

                    {/* Per-test-case breakdown */}
                    {testResults && result.status !== 'PENDING' && (
                      <div className="space-y-2">
                        {testResults.map((tc, i) => (
                          <div
                            key={i}
                            className={cn(
                              'rounded-xl border overflow-hidden',
                              tc.passed ? 'border-emerald-500/30' : 'border-red-500/30'
                            )}
                          >
                            {/* Header */}
                            <div className={cn(
                              'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold',
                              tc.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            )}>
                              {tc.passed
                                ? <CheckCircle2 className="w-3.5 h-3.5" />
                                : <XCircle className="w-3.5 h-3.5" />
                              }
                              Test Case {i + 1}
                              {tc.input === null && (
                                <span className="ml-auto flex items-center gap-1 opacity-50 text-[10px] font-normal">
                                  <Lock className="w-2.5 h-2.5" /> Hidden
                                </span>
                              )}
                            </div>

                            {/* Body */}
                            <div className="p-3 space-y-2 font-mono text-xs bg-[#0d0d0d]">
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
                    {!testResults && result.errorMsg && (
                      <div className="rounded-xl overflow-hidden border border-red-500/30">
                        <div className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-mono font-semibold">Error</div>
                        <pre className="p-3 text-xs text-red-300 font-mono whitespace-pre-wrap bg-[#0d0d0d]">{result.errorMsg}</pre>
                      </div>
                    )}

                    {result.status === 'ACCEPTED' && (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium py-1">
                        <CheckCircle2 className="w-5 h-5" />
                        All test cases passed! 🎉
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* ── Submissions tab ── */
              <div className="space-y-3">
                {!submissions || submissions.length === 0 ? (
                  <div className="text-center py-12 text-zinc-600 text-sm">
                    No submissions yet
                  </div>
                ) : (
                  submissions.map((sub: any) => {
                    const cfg = STATUS_CONFIG[sub.status];
                    const Icon = cfg?.icon || CheckCircle2;
                    return (
                      <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm">
                        <Icon className={cn('w-4 h-4 shrink-0', cfg?.color)} />
                        <span className={cn('font-semibold', cfg?.color)}>{cfg?.label}</span>
                        <span className="text-zinc-500 text-xs">{sub.language}</span>
                        <span className="text-zinc-600 text-xs ml-auto">{sub.testsPassed}/{sub.testsTotal}</span>
                        {sub.runtimeMs > 0 && (
                          <span className="flex items-center gap-1 text-zinc-600 text-xs">
                            <Clock className="w-3 h-3" /> {sub.runtimeMs}ms
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Drag handle ───────────────────────────────────────── */}
        <div
          onMouseDown={startDrag}
          className="w-1 bg-zinc-800 hover:bg-primary-500/50 cursor-col-resize transition-colors shrink-0 active:bg-primary-500"
        />

        {/* ── RIGHT: Editor only ────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex items-center gap-3 px-4 py-2 bg-[#161616] border-b border-zinc-800 shrink-0">
            {/* Language selector */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors">
                {LANGUAGES.find(l => l.id === selectedLang)?.label || selectedLang}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50 hidden group-focus-within:block group-hover:block min-w-[130px]">
                {availableLangs.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLang(lang.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm transition-colors',
                      selectedLang === lang.id ? 'bg-primary-600/20 text-primary-400' : 'text-zinc-300 hover:bg-zinc-700'
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
              className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex-1" />

            {/* Submit */}
            <button
              onClick={() => submitMutation.mutate({ code, language: selectedLang })}
              disabled={submitMutation.isPending || isPolling}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
            >
              {(submitMutation.isPending || isPolling) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit
            </button>
          </div>

          {/* Monaco Editor — full height, no result panel here */}
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
