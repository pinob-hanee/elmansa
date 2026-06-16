import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, BookOpen, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { adminCoursesApi } from '../../features/courses/api/admin.courses';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function AdminCourses() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', search],
    queryFn: () => adminCoursesApi.getAdminCourses({ search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCoursesApi.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const handleDelete = (id: string) => {
    toast((toastItem) => (
      <div className="flex flex-col gap-4 p-1" dir="rtl">
        <p className="font-semibold text-surface-900 text-sm">{t('adminCourses.deleteConfirm', 'هل أنت متأكد من الحذف؟ لا يمكن التراجع.')}</p>
        <div className="flex gap-3 justify-end mt-1">
          <button 
            onClick={() => toast.dismiss(toastItem.id)} 
            className="px-4 py-2 text-xs font-bold bg-surface-100 hover:bg-surface-200 text-surface-600 rounded-xl transition-colors border border-surface-200"
          >
            إلغاء
          </button>
          <button 
            onClick={() => {
              toast.dismiss(toastItem.id);
              deleteMutation.mutate(id);
            }} 
            className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-sm shadow-red-500/20"
          >
            نعم، احذف
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const courses = data?.data || [];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 mb-1">{t('adminCourses.title', 'الكورسات')}</h1>
          <p className="text-surface-400 text-sm">{t('adminCourses.subtitle', 'إدارة الكورسات، المناهج، والمحتوى التعليمي')}</p>
        </div>
        <Link
          to="/admin/courses/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          {t('adminCourses.addNew', 'إضافة كورس جديد')}
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('adminCourses.search', 'ابحث عن كورس...')}
            className="w-full bg-surface-900 border border-surface-800 rounded-xl py-2 pr-10 pl-4 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-surface-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-surface-200">
          <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-surface-600" />
          </div>
          <h3 className="text-lg font-bold text-surface-50 mb-2">{t('adminCourses.noCourses', 'لا توجد كورسات')}</h3>
          <p className="text-surface-400 mb-6">{t('adminCourses.noCoursesDesc', 'لم تقم بإضافة أي كورسات بعد.')}</p>
          <Link
            to="/admin/courses/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            {t('adminCourses.createFirst', 'إنشاء الكورس الأول')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
            <div key={course.id} className="glass rounded-2xl overflow-hidden border border-surface-200 flex flex-col group hover:border-primary-500/30 transition-all">
              <Link to={`/admin/courses/${course.id}/edit`} className="aspect-video bg-surface-800 relative block group-hover:opacity-90 transition-opacity">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-surface-600">
                    <BookOpen className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md",
                    course.isPublished ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                  )}>
                    {course.isPublished ? t('adminCourses.published', 'منشور') : t('adminCourses.draft', 'مسودة')}
                  </span>
                </div>
              </Link>
              <div className="p-5 flex-1 flex flex-col">
                <Link to={`/admin/courses/${course.id}/edit`} className="font-bold text-surface-50 text-lg mb-2 line-clamp-1 hover:text-primary-400 transition-colors">
                  {course.title}
                </Link>
                <p className="text-surface-400 text-sm line-clamp-2 mb-4 flex-1">
                  {course.description || t('adminCourses.noDescription', 'لا يوجد وصف')}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-surface-800 text-sm">
                  <div className="text-surface-400">
                    {course._count?.enrollments || 0} {t('adminCourses.student', 'طالب')}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                      className="p-2 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(course.id);
                      }}
                      className="p-2 text-surface-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
