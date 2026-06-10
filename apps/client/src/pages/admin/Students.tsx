import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, UserCheck, UserX, Clock, Search, ChevronDown,
  Check, X, Ban, AlertCircle, Filter, BookOpen
} from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const statusConfig = {
  PENDING: { label: 'في الانتظار', color: 'text-warning bg-warning/10 border-warning/30', icon: Clock },
  APPROVED: { label: 'مقبول', color: 'text-success bg-success/10 border-success/30', icon: UserCheck },
  REJECTED: { label: 'مرفوض', color: 'text-error bg-error/10 border-error/30', icon: UserX },
  SUSPENDED: { label: 'موقوف', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', icon: AlertCircle },
  BANNED: { label: 'محظور', color: 'text-red-500 bg-red-500/10 border-red-500/30', icon: Ban },
};

function EnrollmentsModal({ student, onClose }: { student: any, onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['student-enrollments', student.id],
    queryFn: () => api.get(`/admin/students/${student.id}/enrollments`).then(r => r.data?.data),
  });

  const dropMutation = useMutation({
    mutationFn: (courseId: string) => api.patch(`/admin/students/${student.id}/enrollments/${courseId}/drop`),
    onSuccess: () => {
      toast.success(t('adminStudents.dropSuccess', 'تم إيقاف الكورس للطالب'));
      qc.invalidateQueries({ queryKey: ['student-enrollments', student.id] });
    },
    onError: () => toast.error(t('adminStudents.dropError', 'حدث خطأ أثناء إيقاف الكورس')),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose} dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-surface-800 bg-surface-900/50">
          <h2 className="text-xl font-bold text-surface-50 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-500" />
            {t('adminStudents.courseList', { name: student.profile?.firstName })}
          </h2>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-50 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="text-center text-surface-500 py-8">{t('common.loading')}</div>
          ) : !enrollments || enrollments.length === 0 ? (
            <div className="text-center text-surface-500 py-8">{t('adminStudents.noCourses')}</div>
          ) : (
            enrollments.map((en: any) => (
              <div key={en.id} className="flex items-center gap-4 p-3 rounded-xl border border-surface-800 bg-surface-800/30">
                <div className="w-12 h-12 rounded-lg bg-surface-800 overflow-hidden shrink-0">
                  {en.course.thumbnail ? (
                    <img src={en.course.thumbnail} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-6 h-6 m-3 text-surface-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-surface-50 font-medium text-sm line-clamp-1">{en.course.title}</h4>
                  <p className="text-xs text-surface-400 mt-1">{t('adminStudents.courseStatus', { status: en.status === 'ACTIVE' ? t('adminStudents.active') : en.status === 'DROPPED' ? t('adminStudents.dropped') : en.status })}</p>
                </div>
                {en.status === 'ACTIVE' && (
                  <button
                    onClick={() => dropMutation.mutate(en.course.id)}
                    disabled={dropMutation.isPending}
                    className="px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                  >
                    إيقاف الكورس
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminStudents() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', search, statusFilter, page],
    queryFn: () =>
      api.get('/admin/students', {
        params: { search: search || undefined, status: statusFilter || undefined, page },
      }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      api.patch(`/admin/students/${id}/status`, { status, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-students'] }),
  });

  const stats = [
    { label: 'إجمالي الطلاب', value: data?.meta?.total || 0, icon: Users, color: 'from-primary-500 to-purple-600' },
    { label: 'في الانتظار', value: 0, icon: Clock, color: 'from-amber-500 to-orange-600' },
    { label: 'مقبولون', value: 0, icon: UserCheck, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-50 mb-1">{t('adminStudents.title')}</h1>
        <p className="text-surface-400">{t('adminStudents.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('adminStudents.searchPlaceholder')}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 focus:border-primary-500 text-surface-50 placeholder-surface-500 text-sm outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-300 text-sm outline-none transition-all focus:border-primary-500"
        >
          <option value="">{t('adminStudents.allStatuses')}</option>
          <option value="PENDING">{t('adminStudents.pending')}</option>
          <option value="APPROVED">{t('adminStudents.approved')}</option>
          <option value="REJECTED">{t('adminStudents.rejected')}</option>
          <option value="SUSPENDED">{t('adminStudents.suspended')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-surface-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">{t('adminStudents.student')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">{t('adminStudents.details')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">{t('adminStudents.status')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">{t('adminStudents.registrationDate')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">{t('adminStudents.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-10 bg-surface-800 rounded-xl animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-surface-500">
                    لا يوجد طلاب مطابقون للبحث
                  </td>
                </tr>
              ) : (
                data?.data?.map((student: any) => {
                  const StatusIcon = statusConfig[student.approvalStatus as keyof typeof statusConfig]?.icon || Clock;
                  return (
                    <tr key={student.id} className="hover:bg-surface-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {student.profile?.firstName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-surface-50">
                              {student.profile?.firstName} {student.profile?.lastName}
                            </p>
                            <p className="text-xs text-surface-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-surface-300">{student.profile?.grade || '—'}</p>
                        <p className="text-xs text-surface-500">{student.profile?.city || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border',
                          statusConfig[student.approvalStatus as keyof typeof statusConfig]?.color
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[student.approvalStatus as keyof typeof statusConfig]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-400">
                        {new Date(student.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {student.approvalStatus !== 'APPROVED' && (
                            <button
                              onClick={() => updateStatus.mutate({ id: student.id, status: 'APPROVED' })}
                              disabled={updateStatus.isPending}
                              className="p-1.5 rounded-lg bg-success/10 hover:bg-success/20 text-success transition-all"
                              title={t('adminStudents.approve')}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {student.approvalStatus !== 'REJECTED' && (
                            <button
                              onClick={() => updateStatus.mutate({ id: student.id, status: 'REJECTED' })}
                              disabled={updateStatus.isPending}
                              className="p-1.5 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-all"
                              title={t('adminStudents.reject')}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {student.approvalStatus !== 'SUSPENDED' && (
                            <button
                              onClick={() => updateStatus.mutate({ id: student.id, status: 'SUSPENDED' })}
                              disabled={updateStatus.isPending}
                              className="p-1.5 rounded-lg bg-warning/10 hover:bg-warning/20 text-warning transition-all"
                              title={t('adminStudents.suspend')}
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 transition-all ml-2"
                            title={t('adminStudents.viewCourses')}
                          >
                            <BookOpen className="w-4 h-4" />
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

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-800">
            <p className="text-sm text-surface-400">
              {t('adminStudents.showing', { start: ((page - 1) * data.meta.limit) + 1, end: Math.min(page * data.meta.limit, data.meta.total), total: data.meta.total })}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-surface-700 text-surface-400 hover:text-surface-50 hover:border-surface-600 disabled:opacity-40 text-sm transition-all"
              >
                السابق
              </button>
              <button
                disabled={page === data.meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-surface-700 text-surface-400 hover:text-surface-50 hover:border-surface-600 disabled:opacity-40 text-sm transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedStudent && (
        <EnrollmentsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
