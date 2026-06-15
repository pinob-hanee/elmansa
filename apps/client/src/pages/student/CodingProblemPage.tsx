import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Play, Send, ChevronLeft, CheckCircle2, XCircle,
  Clock, Cpu, BookOpen, RotateCcw, ChevronDown, Loader2,
  AlertTriangle, Terminal
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

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  ACCEPTED: { color: 'text-emerald-400', icon: CheckCircle2, label: 'Accepted' },
  WRONG_ANSWER: { color: 'text-red-400', icon: XCircle, label: 'Wrong Answer' },
  TIME_LIMIT_EXCEEDED: { color: 'text-amber-400', icon: Clock, label: 'Time Limit Exceeded' },
  COMPILE_ERROR: { color: 'text-red-400', icon: Terminal, label: 'Compile Error' },
  RUNTIME_ERROR: { color: 'text-red-400', icon: AlertTriangle, label: 'Runtime Error' },
  PENDING: { color: 'text-blue-400', icon: Loader2, label: 'Running...' },
};

const DIFFICULTY_CONFIG: Record<string, string> = {
  EASY: 'text-emerald-400 bg-emerald-500/10',
  MEDIUM: 'text-amber-400 bg-amber-500/10',
  HARD: 'text-red-400 bg-red-500/10',
};

export default function CodingProblemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [selectedLang, setSelectedLang] = useState('python');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');
  const [result, setResult] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [leftWidth, setLeftWidth] = useState(42); // percent
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: problem, isLoading } = useQuery({
    queryKey: ['coding-problem', id],
    queryFn: () => api.get(`/coding/problems/${id}`).then(r => r.data.data),
  });

  const { data: submissions, refetch: refetchSubmissions } = useQuery({
    queryKey: ['my-submissions', id],
    queryFn: () => api.get(`/coding/problems/${id}/my-submissions`).then(r => r.data.data),
    enabled: activeTab === 'submissions',
  });

  // Set initial code when problem loads or language changes
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
      // Poll for result
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
      <div className="h-screen bg-surface-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-screen bg-surface-950 flex items-center justify-center text-surface-400">
        Problem not found
      </div>
    );
  }

  const difficultyLabel: Record<string, string> = {
    EASY: t('coding.easy', 'سهل'),
    MEDIUM: t('coding.medium', 'متوسط'),
    HARD: t('coding.hard', 'صعب'),
  };

  const availableLangs = LANGUAGES.filter(l => problem.languages?.includes(l.id) || problem.languages?.length === 0);

  const statusConfig = result ? STATUS_CONFIG[result.status] || STATUS_CONFIG.PENDING : null;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex flex-col h-screen bg-surface-950 overflow-hidden"
    >
      {/* Top bar */}
      <header className="h-12 bg-surface-900 border-b border-surface-800 flex items-center gap-4 px-4 shrink-0 z-10">
        <button
          onClick={() => navigate('/coding')}
          className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('coding.problems', 'المسائل')}
        </button>
        <div className="h-4 w-px bg-surface-700" />
        <span className="text-sm font-medium text-surface-50 truncate">{isRtl ? (problem.titleAr || problem.title) : problem.title}</span>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium ml-auto', DIFFICULTY_CONFIG[problem.difficulty])}>
          {difficultyLabel[problem.difficulty]}
        </span>
      </header>

      {/* Main split pane */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden select-none">
        {/* Left: Problem description */}
        <div style={{ width: `${leftWidth}%` }} className="flex flex-col bg-surface-950 overflow-hidden border-r border-surface-800">
          {/* Tabs */}
          <div className="flex border-b border-surface-800 shrink-0 px-2">
            {(['problem', 'submissions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab ? 'border-primary-500 text-primary-400' : 'border-transparent text-surface-400 hover:text-surface-50'
                )}
              >
                {tab === 'problem' ? t('coding.description', 'الوصف') : t('coding.submissions', 'إجاباتي')}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'problem' ? (
              <div className="prose prose-invert max-w-none text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {(isRtl ? problem.descriptionAr : problem.description) || problem.description}
                </ReactMarkdown>

                {/* Sample test cases */}
                {(problem.testCases as any[]).filter(tc => !tc.isHidden).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-surface-50 font-bold text-sm mb-3">{t('coding.examples', 'أمثلة')}</h3>
                    {(problem.testCases as any[])
                      .filter(tc => !tc.isHidden)
                      .map((tc: any, i: number) => (
                        <div key={i} className="mb-4 rounded-xl overflow-hidden border border-surface-800">
                          <div className="bg-surface-900 px-3 py-1.5 text-xs text-surface-500 font-mono">
                            {t('coding.example', 'مثال')} {i + 1}
                          </div>
                          <div className="p-3 bg-surface-950 space-y-2 font-mono text-xs">
                            <div>
                              <span className="text-surface-500">{t('coding.input', 'المدخل')}: </span>
                              <span className="text-surface-200">{tc.input || '(none)'}</span>
                            </div>
                            <div>
                              <span className="text-surface-500">{t('coding.output', 'المخرج')}: </span>
                              <span className="text-emerald-300">{tc.expectedOutput}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {!submissions || submissions.length === 0 ? (
                  <div className="text-center py-12 text-surface-500 text-sm">
                    {t('coding.noSubmissions', 'لا توجد إجابات بعد')}
                  </div>
                ) : (
                  submissions.map((sub: any) => {
                    const cfg = STATUS_CONFIG[sub.status];
                    const Icon = cfg?.icon || CheckCircle2;
                    return (
                      <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-900 border border-surface-800 text-sm">
                        <Icon className={cn('w-4 h-4 shrink-0', cfg?.color)} />
                        <span className={cn('font-medium', cfg?.color)}>{cfg?.label}</span>
                        <span className="text-surface-500 text-xs ml-auto">{sub.language}</span>
                        <span className="text-surface-500 text-xs">{sub.testsPassed}/{sub.testsTotal}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={startDrag}
          className="w-1 bg-surface-800 hover:bg-primary-500/50 cursor-col-resize transition-colors shrink-0 active:bg-primary-500"
        />

        {/* Right: Editor + Result */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Editor header */}
          <div className="flex items-center gap-3 px-4 py-2 bg-surface-900 border-b border-surface-800 shrink-0">
            {/* Language selector */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-sm text-surface-300 bg-surface-800 hover:bg-surface-700 px-3 py-1.5 rounded-lg transition-colors">
                {LANGUAGES.find(l => l.id === selectedLang)?.label || selectedLang}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-surface-800 border border-surface-700 rounded-xl shadow-xl overflow-hidden z-50 hidden group-focus-within:block group-hover:block min-w-[130px]">
                {availableLangs.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLang(lang.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm transition-colors',
                      selectedLang === lang.id ? 'bg-primary-600/20 text-primary-400' : 'text-surface-300 hover:bg-surface-700'
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
              title={t('coding.reset', 'إعادة تعيين')}
              className="p-1.5 text-surface-500 hover:text-surface-300 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex-1" />

            {/* Submit button */}
            <button
              onClick={() => submitMutation.mutate({ code, language: selectedLang })}
              disabled={submitMutation.isPending || isPolling}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
            >
              {(submitMutation.isPending || isPolling) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {t('coding.submit', 'تسليم')}
            </button>
          </div>

          {/* Monaco Editor */}
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

          {/* Result panel */}
          {result && (
            <div className="border-t border-surface-800 bg-surface-900 overflow-hidden flex flex-col" style={{ maxHeight: '280px' }}>
              {/* Status bar */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-800 shrink-0">
                {statusConfig && (
                  <>
                    <statusConfig.icon className={cn('w-4 h-4 shrink-0', statusConfig.color, result.status === 'PENDING' && 'animate-spin')} />
                    <span className={cn('text-sm font-bold', statusConfig.color)}>{statusConfig.label}</span>
                  </>
                )}
                {result.testsPassed !== undefined && result.status !== 'PENDING' && (
                  <span className="text-xs bg-surface-800 px-2 py-0.5 rounded-full text-surface-400">
                    {result.testsPassed}/{result.testsTotal} {t('coding.testsPassed', 'اختبارات')}
                  </span>
                )}
                {result.runtimeMs > 0 && (
                  <span className="flex items-center gap-1 text-xs text-surface-500 ml-auto">
                    <Clock className="w-3 h-3" /> {result.runtimeMs}ms
                  </span>
                )}
              </div>

              <div className="overflow-y-auto flex-1 p-3 space-y-2">
                {result.status === 'PENDING' && (
                  <div className="flex items-center gap-2 text-blue-400 text-sm p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('coding.running', 'جاري التنفيذ...')}
                  </div>
                )}

                {/* Compile / Runtime error (no per-test breakdown) */}
                {result.errorMsg && result.status !== 'WRONG_ANSWER' && (() => {
                  // Try to check if it's a JSON result with errors
                  try {
                    const parsed = JSON.parse(result.output || '[]');
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].error) {
                      return (
                        <div className="rounded-xl overflow-hidden border border-red-500/30 bg-red-500/5">
                          <div className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-mono font-semibold">
                            {result.status === 'COMPILE_ERROR' ? 'Compile Error' : 'Runtime Error'}
                          </div>
                          <pre className="p-3 text-xs text-red-300 font-mono whitespace-pre-wrap overflow-x-auto">
                            {parsed[0].error}
                          </pre>
                        </div>
                      );
                    }
                  } catch { /* not json */ }
                  return (
                    <div className="rounded-xl overflow-hidden border border-red-500/30 bg-red-500/5">
                      <div className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-mono font-semibold">Error</div>
                      <pre className="p-3 text-xs text-red-300 font-mono whitespace-pre-wrap">{result.errorMsg}</pre>
                    </div>
                  );
                })()}

                {/* Per-test-case results */}
                {result.output && result.status !== 'PENDING' && (() => {
                  try {
                    const testResults: Array<{
                      passed: boolean;
                      input: string | null;
                      expected: string | null;
                      output: string;
                      error?: string;
                    }> = JSON.parse(result.output);
                    if (!Array.isArray(testResults)) return null;
                    return (
                      <div className="space-y-2">
                        {testResults.map((tc, i) => (
                          <div key={i} className={cn(
                            'rounded-xl border overflow-hidden',
                            tc.passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
                          )}>
                            {/* Test case header */}
                            <div className={cn(
                              'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold',
                              tc.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            )}>
                              {tc.passed
                                ? <CheckCircle2 className="w-3.5 h-3.5" />
                                : <XCircle className="w-3.5 h-3.5" />
                              }
                              {t('coding.testCase', 'اختبار')} {i + 1}
                              {tc.input === null && (
                                <span className="ml-auto opacity-60 text-[10px] font-normal">{t('coding.hidden', 'مخفي')}</span>
                              )}
                            </div>

                            {/* Test case details */}
                            <div className="p-3 grid gap-2 font-mono text-xs">
                              {tc.input !== null && (
                                <div className="flex gap-2">
                                  <span className="text-surface-500 shrink-0 w-16">{t('coding.input', 'مدخل')}:</span>
                                  <span className="text-surface-300 break-all">{tc.input || '(none)'}</span>
                                </div>
                              )}
                              {tc.expected !== null && (
                                <div className="flex gap-2">
                                  <span className="text-surface-500 shrink-0 w-16">{t('coding.expected', 'متوقع')}:</span>
                                  <span className="text-emerald-300 break-all">{tc.expected}</span>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <span className="text-surface-500 shrink-0 w-16">{t('coding.yourOutput', 'مخرجاتك')}:</span>
                                <span className={cn('break-all', tc.passed ? 'text-emerald-300' : 'text-red-300')}>
                                  {tc.output || (tc.error ? <span className="text-red-400 whitespace-pre-wrap">{tc.error}</span> : '(empty)')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } catch {
                    // Fallback for old plain-text output
                    return (
                      <div className="font-mono text-xs text-surface-300 p-2 whitespace-pre-wrap">
                        {result.output}
                      </div>
                    );
                  }
                })()}

                {result.status === 'ACCEPTED' && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm p-2 font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    {t('coding.allPassed', 'جميع الاختبارات اجتازت بنجاح! 🎉')}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
