import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { cn } from '../../lib/utils';

export default function CoursesPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search, page],
    queryFn: () => api.get('/courses', { params: { search: search || undefined, page, limit: 12 } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">{t('courses.title')}</h1>
        <p className="text-surface-400">{t('courses.subtitle')}</p>
      </div>

      <div className="relative">
        <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500', isRtl ? 'right-3' : 'left-3')} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('courses.searchPlaceholder')}
          className={cn(
            'w-full max-w-md py-2.5 rounded-xl bg-surface-800 border border-surface-700 focus:border-primary-500 text-white placeholder-surface-500 text-sm outline-none transition-all',
            isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
          )}
        />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-surface-800 animate-pulse" />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-surface-700 mx-auto mb-4" />
          <p className="text-surface-400">{t('courses.noCoursesAvailable')}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.data?.map((course: any, i: number) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="glass rounded-2xl border border-white/5 hover:border-primary-500/30 overflow-hidden transition-all group"
            >
              <div className="h-40 bg-surface-800 relative overflow-hidden">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-900 to-purple-900">
                    <BookOpen className="w-12 h-12 text-primary-400/50" />
                  </div>
                )}
                {Number(course.price) === 0 && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-success/20 border border-success/30 text-success text-xs font-medium">
                    {t('courses.free')}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white mb-2 group-hover:text-primary-400 transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-surface-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-surface-500">
                    {course._count?.enrollments || 0} {t('courses.students')}
                  </div>
                  {Number(course.price) > 0 ? (
                    <span className="text-primary-400 font-bold">{course.price} EGP</span>
                  ) : null}
                </div>
                <Link
                  to={`/courses/${course.slug}`}
                  className="mt-4 block w-full text-center py-2.5 rounded-xl bg-primary-600/20 hover:bg-primary-600 text-primary-400 hover:text-white text-sm font-medium transition-all border border-primary-500/30 hover:border-transparent"
                >
                  {t('courses.viewCourse')}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
