import { motion, type Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Code2, Terminal, GitBranch, Clock, AlertTriangle, CheckCircle2, PlayCircle, Compass, BookOpen } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const isPending = user?.approvalStatus === 'PENDING';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => api.get('/users/dashboard').then((r) => r.data.data),
    // Don't retry on error, just show error state
    retry: 1,
    // Skip if pending — they have no enrollments yet
    enabled: !isPending,
  });

  const stats = [
    { label: 'كورسات مسجّل بها', value: data?.stats?.enrolledCount ?? 0, icon: Terminal, color: 'from-primary-500 to-purple-600' },
    { label: 'كورسات أكملتها', value: data?.stats?.completedCount ?? 0, icon: GitBranch, color: 'from-emerald-500 to-teal-600' },
    { label: 'إشعارات جديدة', value: data?.stats?.unreadNotifications ?? 0, icon: Code2, color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div dir="rtl" className="space-y-8">
      {/* Welcome */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-extrabold text-white mb-1 font-mono">
          <span className="text-primary-400">{'>'}</span> مرحباً، {user?.profile?.firstName || user?.email?.split('@')[0]}! 👨‍💻
        </h1>
        <p className="text-surface-400 font-mono text-sm">{'// استمر في رحلتك البرمجية اليوم'}</p>
      </motion.div>

      {/* Pending Approval Banner */}
      {isPending && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-300 font-bold text-lg mb-1">حسابك قيد المراجعة</h3>
              <p className="text-amber-200/70 text-sm leading-relaxed mb-3">
                طلب تسجيلك بانتظار موافقة المسؤول. سيتم إشعارك فور قبول حسابك وستتمكن حينها من الوصول إلى جميع الكورسات.
              </p>
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>عادةً ما يستغرق القبول 24 ساعة</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {!isPending && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
                className="glass rounded-2xl p-5 border border-white/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', stat.color)}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white mb-1">
                  {isLoading ? <div className="h-8 w-12 bg-surface-800 rounded animate-pulse" /> : stat.value}
                </div>
                <div className="text-surface-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* In Progress Courses */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">الكورسات الجارية</h2>
              <Link to="/courses" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">
                عرض الكل
              </Link>
            </div>
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-24 rounded-2xl bg-surface-800 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div className="glass rounded-2xl p-8 text-center border border-error/20 bg-error/5">
                <AlertTriangle className="w-10 h-10 text-error mx-auto mb-3" />
                <p className="text-surface-400">حدث خطأ أثناء تحميل البيانات</p>
              </div>
            ) : !data?.inProgressCourses?.length ? (
              <div className="glass rounded-2xl p-8 text-center border border-white/5">
                <BookOpen className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                <p className="text-surface-400 mb-4">لم تسجل في أي كورس بعد</p>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm transition-all font-medium"
                >
                  <Compass className="w-4 h-4" />
                  استعرض الكورسات
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {data.inProgressCourses.map((enrollment: any) => (
                  <Link
                    key={enrollment.id}
                    to={`/courses/${enrollment.course.slug}`}
                    className="glass rounded-2xl p-4 border border-white/5 hover:border-primary-500/30 transition-all group flex items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-xl bg-surface-800 overflow-hidden shrink-0">
                      {enrollment.course.thumbnailUrl ? (
                        <img src={enrollment.course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-900 to-purple-900">
                          <BookOpen className="w-6 h-6 text-primary-400/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate group-hover:text-primary-400 transition-colors">
                        {enrollment.course.title}
                      </p>
                      <div className="mt-2 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-purple-600 rounded-full transition-all"
                          style={{ width: `${Number(enrollment.progress) || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-surface-500 mt-1">{Number(enrollment.progress) || 0}% مكتمل</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
            <h2 className="text-lg font-bold text-white mb-4">النشاط الأخير</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-surface-800 animate-pulse" />)}
              </div>
            ) : !data?.recentActivity?.length ? (
              <div className="glass rounded-xl p-6 text-center border border-white/5">
                <Clock className="w-8 h-8 text-surface-600 mx-auto mb-2" />
                <p className="text-surface-400 text-sm">لا يوجد نشاط مؤخراً</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="glass rounded-xl p-4 border border-white/5 flex items-center gap-3">
                    <PlayCircle className="w-5 h-5 text-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-300 truncate">
                        شاهدت: <span className="text-white">{activity.lesson?.title}</span>
                      </p>
                      <p className="text-xs text-surface-500">
                        {activity.lesson?.chapter?.module?.course?.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Browse Courses CTA for pending users */}
      {isPending && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
          <div className="glass rounded-2xl p-8 border border-white/5 text-center">
            <CheckCircle2 className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">استعرض الكورسات بينما تنتظر</h3>
            <p className="text-surface-400 text-sm mb-6">يمكنك رؤية الكورسات المتاحة الآن وستتمكن من التسجيل بعد قبول حسابك</p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-all"
            >
              <BookOpen className="w-5 h-5" />
              تصفح الكورسات
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
