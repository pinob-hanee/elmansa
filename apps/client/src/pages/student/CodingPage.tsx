import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Code2, Search, CheckCircle2, Clock, Zap, Filter, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import { useDebounce } from '../../hooks/useDebounce';

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  EASY: { label: 'سهل', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  MEDIUM: { label: 'متوسط', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  HARD: { label: 'صعب', color: 'text-red-400', bg: 'bg-red-500/10' },
};

export default function CodingPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['coding-problems', debouncedSearch, difficulty],
    queryFn: () =>
      api.get('/coding/problems', { params: { search: debouncedSearch, difficulty } }).then(r => r.data),
  });

  const problems = data?.data || [];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-surface-50">
            {t('coding.title', 'مسائل البرمجة')}
          </h1>
        </div>
        <p className="text-surface-400 text-sm mr-13">
          {t('coding.subtitle', 'حل مسائل برمجية وطوّر مهاراتك')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500', isRtl ? 'right-3' : 'left-3')} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('coding.search', 'ابحث عن مسألة...')}
            className={cn(
              'w-full bg-surface-900 border border-surface-800 rounded-xl py-2.5 text-surface-50 text-sm placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 transition-all',
              isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
            )}
          />
        </div>
        <div className="flex gap-2">
          {(['', 'EASY', 'MEDIUM', 'HARD'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={cn(
                'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                difficulty === d
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-50'
              )}
            >
              {d === '' ? t('coding.all', 'الكل') : DIFFICULTY_CONFIG[d]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: CheckCircle2, label: t('coding.solved', 'محلول'), count: 0, color: 'text-emerald-400' },
          { icon: Clock, label: t('coding.attempted', 'محاولة'), count: 0, color: 'text-amber-400' },
          { icon: Zap, label: t('coding.total', 'إجمالي'), count: problems.length, color: 'text-primary-400' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-4 border border-surface-200 flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center', stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-surface-50">{stat.count}</div>
              <div className="text-xs text-surface-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Problem List */}
      <div className="glass rounded-2xl border border-surface-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-800 bg-surface-900/50">
              <th className="px-5 py-3.5 text-right text-xs font-medium text-surface-500 uppercase tracking-wider w-8">#</th>
              <th className="px-5 py-3.5 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">
                {t('coding.problem', 'المسألة')}
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-medium text-surface-500 uppercase tracking-wider">
                {t('coding.difficulty', 'الصعوبة')}
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-medium text-surface-500 uppercase tracking-wider hidden sm:table-cell">
                {t('coding.languages', 'اللغات')}
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-5 py-4">
                    <div className="h-6 bg-surface-800 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <Code2 className="w-10 h-10 text-surface-700 mx-auto mb-3" />
                  <p className="text-surface-500 text-sm">{t('coding.noProblems', 'لا توجد مسائل متاحة حالياً')}</p>
                </td>
              </tr>
            ) : (
              problems.map((p: any, index: number) => {
                const diff = DIFFICULTY_CONFIG[p.difficulty];
                return (
                  <tr key={p.id} className="hover:bg-surface-800/30 transition-colors group">
                    <td className="px-5 py-4 text-surface-500 text-sm">{index + 1}</td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/coding/${p.id}`}
                        className="font-medium text-surface-100 hover:text-primary-400 transition-colors text-sm"
                      >
                        {isRtl ? (p.titleAr || p.title) : p.title}
                      </Link>
                      {p.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {p.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[10px] bg-surface-800 text-surface-500 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', diff?.color, diff?.bg)}>
                        {diff?.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {(p.languages || []).slice(0, 3).map((lang: string) => (
                          <span key={lang} className="text-[10px] bg-surface-800 text-surface-400 px-1.5 py-0.5 rounded font-mono">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <Link to={`/coding/${p.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-surface-400" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
