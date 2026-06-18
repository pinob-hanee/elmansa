import { motion, type Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Code2, Terminal, GitBranch, Clock, AlertTriangle, CheckCircle2, PlayCircle, Compass, BookOpen, Flame, Star, Award, Trophy, Crown, Medal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { gamificationApi } from '../../features/gamification/api/gamification';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function StudentDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const isPending = user?.isEmailVerified === false;
  const isRtl = i18n.language === 'ar';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => api.get('/users/dashboard').then((r) => r.data.data),
    // Don't retry on error, just show error state
    retry: 1,
    // Skip if pending — they have no enrollments yet
    enabled: !isPending,
  });

  const { data: gamification } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: gamificationApi.getStats,
    enabled: !isPending,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: gamificationApi.getLeaderboard,
    enabled: !isPending,
  });

  const { data: achievements } = useQuery({
    queryKey: ['gamification-achievements'],
    queryFn: gamificationApi.getAchievements,
    enabled: !isPending,
  });

  const stats = [
    { label: t('dashboard.enrolledCourses'), value: data?.stats?.enrolledCount ?? 0, icon: Terminal, color: 'from-primary-500 to-purple-600' },
    { label: t('dashboard.completedCourses'), value: data?.stats?.completedCount ?? 0, icon: GitBranch, color: 'from-emerald-500 to-teal-600' },
    { label: t('dashboard.newNotifications'), value: data?.stats?.unreadNotifications ?? 0, icon: Code2, color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-8">
      {/* Welcome */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-extrabold text-surface-50 mb-1 font-mono">
          <span className="text-primary-400">{'>'}</span> {t('dashboard.greeting', { name: user?.profile?.firstName || user?.email?.split('@')[0] })}
        </h1>
        <p className="text-surface-400 font-mono text-sm">{t('dashboard.subtitle')}</p>
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
              <h3 className="text-amber-300 font-bold text-lg mb-1">{t('dashboard.accountPending')}</h3>
              <p className="text-amber-200/70 text-sm leading-relaxed mb-3">
                {t('dashboard.accountPendingDesc')}
              </p>
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>{t('dashboard.approvalWaitTime')}</span>
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
                className="glass rounded-2xl p-5 border border-surface-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', stat.color)}>
                    <stat.icon className="w-5 h-5 text-surface-50" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-surface-50 mb-1">
                  {isLoading ? <div className="h-8 w-12 bg-surface-800 rounded animate-pulse" /> : stat.value}
                </div>
                <div className="text-surface-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Gamification Stats */}
          {gamification?.profile && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5 border border-surface-200 md:col-span-2 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all" />
                <div className="relative flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
                      <Star className="w-6 h-6 text-surface-50" />
                    </div>
                    <div className="text-start">
                      <div className="text-surface-400 text-sm font-medium">المستوى الحالي</div>
                      <div className="text-2xl font-extrabold text-surface-50">مستوى {gamification.profile.level}</div>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="text-sm font-bold text-primary-400 whitespace-nowrap">{gamification.profile.xp} XP</div>
                    <div className="text-xs text-surface-500 whitespace-nowrap">من أصل {gamification.profile.level * 1000}</div>
                  </div>
                </div>
                <div className="h-3 bg-surface-800 rounded-full overflow-hidden border border-surface-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(gamification.profile.xp % 1000) / 10}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-surface-800 border border-surface-700 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                  </motion.div>
                </div>
              </div>

              <div className="glass rounded-2xl p-5 border border-surface-200 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all" />
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-3 relative z-10">
                  <Flame className="w-6 h-6 text-surface-50" />
                </div>
                <div className="text-3xl font-extrabold text-surface-50 mb-1 relative z-10">
                  {gamification.profile.currentStreak} <span className="text-lg text-surface-400 font-medium">أيام</span>
                </div>
                <div className="text-sm font-medium text-orange-400 relative z-10">سلسلة التعلم الحالية</div>
              </div>
            </motion.div>
          )}

          {/* In Progress Courses */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-50 text-start">الكورسات الجارية</h2>
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
              <div className="glass rounded-2xl p-8 text-center border border-surface-200">
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
                    className="glass rounded-2xl p-4 border border-surface-200 hover:border-primary-500/30 transition-all group flex items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-xl bg-surface-800 overflow-hidden shrink-0">
                      {enrollment.course.thumbnailUrl ? (
                        <img src={enrollment.course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-800 border border-surface-700">
                          <BookOpen className="w-6 h-6 text-primary-400/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-50 text-sm truncate group-hover:text-primary-400 transition-colors">
                        {enrollment.course.title}
                      </p>
                      <div className="mt-2 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-surface-800 border border-surface-700 rounded-full transition-all"
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
            <h2 className="text-lg font-bold text-surface-50 mb-4 text-start">النشاط الأخير</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-surface-800 animate-pulse" />)}
              </div>
            ) : !data?.recentActivity?.length ? (
              <div className="glass rounded-xl p-6 text-center border border-surface-200">
                <Clock className="w-8 h-8 text-surface-600 mx-auto mb-2" />
                <p className="text-surface-400 text-sm">لا يوجد نشاط مؤخراً</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="glass rounded-xl p-4 border border-surface-200 flex items-center gap-3">
                    <PlayCircle className="w-5 h-5 text-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-300 truncate">
                        شاهدت: <span className="text-surface-50">{activity.lesson?.title}</span>
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

          {/* Achievements + Leaderboard Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Achievements */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
              <h2 className="text-lg font-bold text-surface-50 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                إنجازاتي
              </h2>
              {!achievements?.length ? (
                <div className="glass rounded-2xl p-6 border border-surface-200 text-center">
                  <Trophy className="w-10 h-10 text-surface-600 mx-auto mb-2" />
                  <p className="text-surface-400 text-sm">أكمل دروساً لفتح الإنجازات</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {achievements.slice(0, 6).map((a: any) => (
                    <div
                      key={a.id}
                      className={cn(
                        "glass rounded-xl p-3 border flex items-center gap-3 transition-all",
                        a.earned
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-surface-200 opacity-50 grayscale"
                      )}
                    >
                      <div className="text-2xl shrink-0">{a.iconUrl}</div>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-bold truncate", a.earned ? "text-amber-300" : "text-surface-400")}>
                          {a.nameAr || a.name}
                        </p>
                        <p className="text-[10px] text-surface-500">+{a.points} نقطة</p>
                      </div>
                      {a.earned && <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mr-auto" />}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Leaderboard */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}>
              <h2 className="text-lg font-bold text-surface-50 mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                لوحة المتصدرين
              </h2>
              <div className="glass rounded-2xl border border-surface-200 overflow-hidden">
                {!leaderboard?.length ? (
                  <div className="p-6 text-center">
                    <Medal className="w-10 h-10 text-surface-600 mx-auto mb-2" />
                    <p className="text-surface-400 text-sm">لا يوجد بيانات بعد</p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-800">
                    {leaderboard.slice(0, 5).map((leader: any, i: number) => (
                      <div key={leader.userId} className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-800/30",
                        leader.userId === user?.id && "bg-primary-500/5 border-r-2 border-r-primary-500"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                          i === 0 ? "bg-yellow-500 text-black" :
                          i === 1 ? "bg-slate-400 text-black" :
                          i === 2 ? "bg-amber-700 text-white" :
                          "bg-surface-800 text-surface-400"
                        )}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : leader.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-50 truncate">
                            {leader.name} {leader.userId === user?.id && <span className="text-primary-400 text-xs">(أنت)</span>}
                          </p>
                          <p className="text-xs text-surface-500">مستوى {leader.level} · {leader.city || ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary-400">{leader.xp.toLocaleString()} XP</p>
                          {leader.currentStreak > 0 && (
                            <p className="text-xs text-orange-400">🔥 {leader.currentStreak}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Browse Courses CTA for pending users */}
      {isPending && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
          <div className="glass rounded-2xl p-8 border border-surface-200 text-center">
            <CheckCircle2 className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <h3 className="text-surface-50 font-bold text-lg mb-2">استعرض الكورسات بينما تنتظر</h3>
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
