import { motion, type Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, TrendingUp, Award, ArrowUpRight, Clock } from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data.data),
  });

  const stats = [
    { label: 'إجمالي الطلاب', value: data?.totalStudents ?? 0, sub: `${data?.pendingStudents ?? 0} في الانتظار`, icon: Users, color: 'from-primary-500 to-purple-600', link: '/admin/students' },
    { label: 'الكورسات', value: data?.totalCourses ?? 0, sub: `${data?.publishedCourses ?? 0} منشور`, icon: BookOpen, color: 'from-cyan-500 to-blue-600', link: '/admin/courses' },
    { label: 'إجمالي التسجيلات', value: data?.totalEnrollments ?? 0, sub: 'عبر جميع الكورسات', icon: TrendingUp, color: 'from-emerald-500 to-teal-600', link: '/admin/analytics' },
  ];

  return (
    <div dir="rtl" className="space-y-8">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-extrabold text-white mb-1">لوحة التحكم</h1>
        <p className="text-surface-400">مرحباً! إليك نظرة عامة على المنصة</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.a
            key={stat.label}
            href={stat.link}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={i}
            whileHover={{ y: -2 }}
            className="glass rounded-2xl p-5 border border-white/5 hover:border-primary-500/20 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', stat.color)}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-surface-600 group-hover:text-primary-400 transition-colors" />
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">
              {isLoading ? <div className="h-8 w-16 bg-surface-800 rounded animate-pulse" /> : stat.value}
            </div>
            <div className="text-sm font-medium text-surface-300 mb-0.5">{stat.label}</div>
            <div className="text-xs text-surface-500">{stat.sub}</div>
          </motion.a>
        ))}
      </div>

      {/* Pending students alert */}
      {data?.pendingStudents > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="glass rounded-2xl p-5 border border-warning/20 bg-warning/5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {data.pendingStudents} طالب ينتظر الموافقة
            </p>
            <p className="text-xs text-surface-400">راجع طلبات التسجيل الجديدة</p>
          </div>
          <a
            href="/admin/students?status=PENDING"
            className="px-4 py-2 rounded-xl bg-warning/20 hover:bg-warning/30 text-warning text-sm font-medium transition-all"
          >
            مراجعة
          </a>
        </motion.div>
      )}

      {/* Recent users */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
        <h2 className="text-lg font-bold text-white mb-4">أحدث الطلاب المسجلين</h2>
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">الطالب</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">البريد</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">تاريخ التسجيل</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-surface-500">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={4} className="px-4 py-3">
                    <div className="h-8 bg-surface-800 rounded animate-pulse" />
                  </td></tr>
                ))
              ) : (
                data?.recentUsers?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {user.profile?.firstName?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-medium text-white">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-400">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-surface-400">
                      {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-xs px-2.5 py-1 rounded-full border',
                        user.approvalStatus === 'APPROVED' ? 'text-success bg-success/10 border-success/30' :
                        user.approvalStatus === 'PENDING' ? 'text-warning bg-warning/10 border-warning/30' :
                        'text-error bg-error/10 border-error/30'
                      )}>
                        {user.approvalStatus === 'APPROVED' ? 'مقبول' : user.approvalStatus === 'PENDING' ? 'منتظر' : 'مرفوض'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
