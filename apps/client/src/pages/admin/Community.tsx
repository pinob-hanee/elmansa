import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MessageSquare, Trash2, AlertTriangle, User, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function AdminCommunity() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-community', search, page],
    queryFn: () => api.get('/admin/community/posts', { params: { search, page, limit: 10 } }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/community/posts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-community'] });
    }
  });

  const handleDelete = (id: string) => {
    toast((toastItem) => (
      <div className="flex flex-col gap-4 p-1" dir={isRtl ? "rtl" : "ltr"}>
        <p className="font-semibold text-surface-900 text-sm">{t('adminCommunity.deleteConfirm')}</p>
        <div className="flex gap-3 justify-end mt-1">
          <button onClick={() => toast.dismiss(toastItem.id)} className="px-4 py-2 text-xs font-bold bg-surface-100 hover:bg-surface-200 text-surface-600 rounded-xl transition-colors border border-surface-200">{isRtl ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={() => {
              toast.dismiss(toastItem.id);
              deleteMutation.mutate(id, {
                onSuccess: () => toast.success(t('adminCommunity.deletedSuccess'))
              });
          }} className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-sm shadow-red-500/20">{isRtl ? 'نعم، احذف' : 'Yes, Delete'}</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const posts = data?.data || [];
  const meta = data?.meta || { totalPages: 1 };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 mb-1">{t('adminCommunity.title')}</h1>
          <p className="text-surface-400 text-sm">{isRtl ? 'مراقبة وإدارة النقاشات ومنشورات الطلاب' : 'Monitor and manage student discussions and posts'}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('adminCommunity.searchPlaceholder')}
            className="w-full bg-surface-900 border border-surface-800 rounded-xl py-2 pr-10 pl-4 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>
      </div>

      <div className="glass rounded-2xl border border-surface-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-800 bg-surface-900/50">
              <th className="px-4 py-4 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">{t('adminCommunity.post')}</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">{t('adminCommunity.author')}</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">{isRtl ? 'تاريخ النشر' : 'Publish Date'}</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">{isRtl ? 'الإحصائيات' : 'Stats'}</th>
              <th className="px-4 py-4 text-center text-xs font-medium text-surface-500 uppercase tracking-wider">{isRtl ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-4">
                  <div className="h-10 bg-surface-800 rounded animate-pulse" />
                </td></tr>
              ))
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-surface-500">
                  {isRtl ? 'لا توجد منشورات مطابقة للبحث' : 'No posts match your search'}
                </td>
              </tr>
            ) : (
              posts.map((post: any) => (
                <tr key={post.id} className="hover:bg-surface-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 max-w-md">
                      {post.title && <span className="font-bold text-surface-50 text-sm line-clamp-1">{post.title}</span>}
                      <span className="text-surface-400 text-sm line-clamp-2">{post.content}</span>
                      {post.course && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary-400 mt-1">
                          <BookOpen className="w-3 h-3" /> {post.course.title}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {post.author.profile?.firstName?.charAt(0) || '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-surface-50 line-clamp-1">
                          {post.author.profile?.firstName} {post.author.profile?.lastName}
                        </span>
                        <span className="text-xs text-surface-500 line-clamp-1">{post.author.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-surface-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ar })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3 text-xs text-surface-400">
                      <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post._count?.comments || 0}</span>
                      <span className={cn("flex items-center gap-1", post._count?.reports > 0 && "text-warning font-bold")}>
                        <AlertTriangle className="w-3.5 h-3.5" /> {post._count?.reports || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={() => handleDelete(post.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-surface-500 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                      title={isRtl ? "حذف المنشور" : "Delete Post"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-surface-900 border border-surface-800 rounded-xl text-sm text-surface-300 disabled:opacity-50"
          >
            {isRtl ? 'السابق' : 'Previous'}
          </button>
          <span className="px-4 py-2 text-sm text-surface-400">
            {isRtl ? `صفحة ${page} من ${meta.totalPages}` : `Page ${page} of ${meta.totalPages}`}
          </span>
          <button
            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="px-4 py-2 bg-surface-900 border border-surface-800 rounded-xl text-sm text-surface-300 disabled:opacity-50"
          >
            {isRtl ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
