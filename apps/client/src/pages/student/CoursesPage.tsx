import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import { useDebounce } from '../../hooks/useDebounce';

// React.memo prevents the card from re-rendering on every keystroke in the parent search input
const CourseCard = React.memo(({ course, index, t }: { course: any; index: number; t: any }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="glass rounded-2xl border border-surface-200 hover:border-primary-500/30 overflow-hidden transition-all group flex flex-col"
    >
      <div className="h-40 bg-surface-800 relative overflow-hidden shrink-0">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-900 to-purple-900">
            <BookOpen className="w-12 h-12 text-primary-400/50" />
          </div>
        )}
        {Number(course.price) === 0 && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-success/20 border border-success/30 text-success text-xs font-medium backdrop-blur-sm">
            {t('courses.free')}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-surface-50 mb-2 group-hover:text-primary-400 transition-colors line-clamp-2">
          {course.title}
        </h3>
        <p className="text-surface-400 text-sm mb-4 line-clamp-2 flex-1">{course.description}</p>
        <div className="flex items-center justify-between mt-auto mb-4">
          <div className="text-sm text-surface-500">
            {course._count?.enrollments || 0} {t('courses.students')}
          </div>
          {Number(course.price) > 0 ? (
            <span className="text-primary-400 font-bold">{course.price} EGP</span>
          ) : null}
        </div>
        <Link
          to={`/courses/${course.slug}`}
          className="block w-full text-center py-2.5 rounded-xl bg-primary-600/20 hover:bg-primary-600 text-primary-400 hover:text-white text-sm font-medium transition-all border border-primary-500/30 hover:border-transparent"
        >
          {t('courses.viewCourse')}
        </Link>
      </div>
    </motion.div>
  );
});

export default function CoursesPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['courses', debouncedSearch, page],
    queryFn: () => api.get('/courses', { params: { search: debouncedSearch || undefined, page, limit: 12 } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-50 mb-1">{t('courses.title')}</h1>
        <p className="text-surface-400">{t('courses.subtitle')}</p>
      </div>

      <div className="relative">
        <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500', isRtl ? 'right-3' : 'left-3')} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('courses.searchPlaceholder')}
          className={cn(
            'w-full max-w-md py-2.5 rounded-xl bg-surface-800 border border-surface-700 focus:border-primary-500 text-surface-50 placeholder-surface-500 text-sm outline-none transition-all',
            isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
          )}
        />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[22rem] rounded-2xl bg-surface-800 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{t('common.loadError', 'Failed to load courses')}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-50 rounded-lg">
            {t('common.retry', 'Try Again')}
          </button>
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-16 bg-surface-900 border border-surface-800 rounded-2xl">
          <BookOpen className="w-16 h-16 text-surface-700 mx-auto mb-4" />
          <p className="text-surface-400">{t('courses.noCoursesAvailable')}</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data?.data?.map((course: any, i: number) => (
              <CourseCard key={course.id} course={course} index={i} t={t} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-surface-800 text-surface-50 hover:bg-surface-700 disabled:opacity-50 disabled:hover:bg-surface-800 transition-colors"
              >
                {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                      page === i + 1 
                        ? "bg-primary-600 text-white" 
                        : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-50"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-surface-800 text-surface-50 hover:bg-surface-700 disabled:opacity-50 disabled:hover:bg-surface-800 transition-colors"
              >
                {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
