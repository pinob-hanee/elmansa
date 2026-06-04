import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Home, Users, Bell, User,
  Menu, X, LogOut, ChevronRight, Terminal, Zap
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import api from '../lib/api';
import NotificationBell from '../features/notifications/components/NotificationBell';
import { useQuery } from '@tanstack/react-query';
import { gamificationApi } from '../features/gamification/api/gamification';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/layout/LanguageSwitcher';

export default function StudentLayout() {
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const isRtl = i18n.language === 'ar';
  const isPending = user?.approvalStatus === 'PENDING';

  // Live XP / level — auto-updates when gamification-stats is invalidated
  const { data: gamification } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: gamificationApi.getStats,
    enabled: !isPending,
    staleTime: 0, // Always re-fetch after invalidation
  });

  const xp = gamification?.profile?.xp ?? 0;
  const level = gamification?.profile?.level ?? 1;
  const XP_PER_LEVEL = 1000;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpPercent = Math.min(100, Math.round((xpInLevel / XP_PER_LEVEL) * 100));

  const navItems = [
    { icon: Home, label: t('nav.dashboard'), href: '/dashboard' },
    { icon: Terminal, label: t('nav.courses'), href: '/courses' },
    { icon: Users, label: t('nav.community'), href: '/community' },
    { icon: Bell, label: t('nav.notifications', 'الإشعارات'), href: '/notifications' },
    { icon: User, label: t('nav.profile', 'ملفي'), href: '/profile' },
  ];

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 72 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative flex flex-col bg-surface-900 border-l border-surface-800 shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-surface-800 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-extrabold text-lg gradient-text whitespace-nowrap overflow-hidden"
                >
                  Elmansa
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative',
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                    : 'text-surface-400 hover:text-white hover:bg-surface-800'
                )}
              >
                <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-primary-400')} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary-500 rounded-full`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-surface-800 shrink-0">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-800 transition-all group">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user?.profile?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.profile?.firstName} {user?.profile?.lastName}
                  </p>
                  <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-surface-500 hover:text-error transition-colors"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* XP / Level bar */}
              {!isPending && (
                <div className="px-2 pb-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                      <Zap className="w-3 h-3" />
                      {isRtl ? `المستوى ${level}` : `Level ${level}`}
                    </div>
                    <span className="text-[10px] text-surface-500 font-mono">{xpInLevel}/{XP_PER_LEVEL} XP</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 rounded-xl text-surface-500 hover:text-error hover:bg-surface-800 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute bottom-20 ${isRtl ? 'left-0 translate-x-1/2' : 'right-0 translate-x-1/2'} w-6 h-6 rounded-full bg-surface-700 border border-surface-600 flex items-center justify-center text-surface-400 hover:text-white transition-all z-10`}
        >
          <ChevronRight className={cn('w-3 h-3 transition-transform', sidebarOpen ? (isRtl ? 'rotate-180' : 'rotate-180') : '')} />
        </button>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-16 glass border-b border-surface-800 flex items-center px-6 gap-4 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-surface-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <LanguageSwitcher />
          <NotificationBell />
          <Link to="/profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.profile?.firstName?.charAt(0) || 'U'}
          </Link>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
