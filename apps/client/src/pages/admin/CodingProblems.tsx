import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, BookOpen, Code2, Search } from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import CodingProblemEditor from './CodingProblemEditor';

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  EASY: { label: 'سهل', color: 'text-emerald-400' },
  MEDIUM: { label: 'متوسط', color: 'text-amber-400' },
  HARD: { label: 'صعب', color: 'text-red-400' },
};

export default function AdminCodingProblems() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingProblem, setEditingProblem] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);

  const { data: problems, isLoading } = useQuery({
    queryKey: ['admin-coding-problems', search],
    queryFn: () =>
      api.get('/coding/admin/problems', { params: { search } }).then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/coding/admin/problems/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coding-problems'] });
      toast.success('تم حذف المسألة');
    },
    onError: () => toast.error('فشل حذف المسألة'),
  });

  const handleDelete = (id: string) => {
    toast((toastItem) => (
      <div className="flex flex-col gap-3" dir="rtl">
        <p className="font-medium text-surface-900">هل أنت متأكد من حذف هذه المسألة؟</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(toastItem.id)} className="px-3 py-1.5 text-xs font-medium bg-surface-200 hover:bg-surface-300 text-surface-700 rounded-lg">إلغاء</button>
          <button onClick={() => { toast.dismiss(toastItem.id); deleteMutation.mutate(id); }} className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg">نعم، احذف</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  if (showEditor) {
    return (
      <CodingProblemEditor
        problem={editingProblem}
        onClose={() => { setShowEditor(false); setEditingProblem(null); qc.invalidateQueries({ queryKey: ['admin-coding-problems'] }); }}
      />
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 mb-1">{t('adminCoding.title', 'مسائل البرمجة')}</h1>
          <p className="text-surface-400 text-sm">{t('adminCoding.subtitle', 'إنشاء وإدارة مسائل البرمجة')}</p>
        </div>
        <button
          onClick={() => { setEditingProblem(null); setShowEditor(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          {t('adminCoding.addNew', 'مسألة جديدة')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('adminCoding.search', 'ابحث عن مسألة...')}
          className="w-full bg-surface-900 border border-surface-800 rounded-xl py-2 pr-10 pl-4 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 transition-all"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-surface-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-800 bg-surface-900/50">
              <th className="px-4 py-4 text-right text-xs font-medium text-surface-500 uppercase">{t('adminCoding.problemTitle', 'المسألة')}</th>
              <th className="px-4 py-4 text-center text-xs font-medium text-surface-500 uppercase">{t('adminCoding.difficulty', 'الصعوبة')}</th>
              <th className="px-4 py-4 text-center text-xs font-medium text-surface-500 uppercase">{t('adminCoding.submissions', 'الإجابات')}</th>
              <th className="px-4 py-4 text-center text-xs font-medium text-surface-500 uppercase">{t('adminCoding.status', 'الحالة')}</th>
              <th className="px-4 py-4 text-center text-xs font-medium text-surface-500 uppercase">{t('adminCoding.actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-8 bg-surface-800 rounded animate-pulse" /></td></tr>
              ))
            ) : !problems || problems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-surface-500">
                  <Code2 className="w-10 h-10 mx-auto mb-3 text-surface-700" />
                  <p>{t('adminCoding.noProblems', 'لا توجد مسائل بعد')}</p>
                </td>
              </tr>
            ) : (
              problems.map((p: any) => {
                const diff = DIFFICULTY_CONFIG[p.difficulty];
                return (
                  <tr key={p.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-medium text-surface-50 text-sm">{p.title}</div>
                      {p.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {p.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[10px] bg-surface-800 text-surface-500 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn('text-xs font-medium', diff?.color)}>{diff?.label}</span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-surface-400">
                      {p._count?.submissions || 0}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', p.isPublished ? 'bg-emerald-500/10 text-emerald-400' : 'bg-surface-800 text-surface-500')}>
                        {p.isPublished ? t('adminCoding.published', 'منشور') : t('adminCoding.draft', 'مسودة')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditingProblem(p); setShowEditor(true); }}
                          className="p-2 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
