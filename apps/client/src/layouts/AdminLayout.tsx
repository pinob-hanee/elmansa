import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Shield,
  MessageSquare,
  Code2,
  ClipboardCheck,
  LogOut,
  BookOpenCheck,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import api from '../lib/api';
import LanguageSwitcher from '../components/layout/LanguageSwitcher';
import Logo from '../components/layout/Logo';
import NotificationBell from '../features/notifications/components/NotificationBell';

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), href: '/admin' },
    { icon: Users, label: t('nav.students'), href: '/admin/students' },
    { icon: BookOpen, label: t('nav.courses'), href: '/admin/courses' },
    { icon: ClipboardCheck, label: t('adminCourses.projectSubmissions', 'Project Submissions'), href: '/admin/submissions' },
    { icon: MessageSquare, label: t('nav.community'), href: '/admin/community' },
    { icon: Code2, label: t('nav.coding', 'Coding'), href: '/admin/coding' },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await api.post('/auth/logout').catch(() => {});
    logout();
    navigate('/login');
    setIsLoggingOut(false);
  };

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Admin Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 72 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "absolute lg:relative inset-y-0 flex flex-col bg-surface-900 border-surface-800 shrink-0 overflow-hidden shadow-2xl z-50",
          isRtl ? "border-l right-0" : "border-r left-0",
          sidebarOpen ? "flex" : "hidden lg:flex"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-surface-800 shrink-0">
          <Link to="/admin" className="flex items-center gap-3 min-w-0">
            <Logo size="md" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  <p className="font-extrabold text-surface-50 text-sm">{t('admin.title')}</p>
                  <p className="text-xs text-surface-500">Elmansa Admin</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === '/admin' 
              ? location.pathname === item.href 
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group relative',
                  isActive
                    ? 'bg-surface-800 text-surface-50 border border-surface-700 font-medium'
                    : 'text-surface-400 hover:text-surface-50 hover:bg-surface-800'
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive && 'text-surface-50')} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeAdminTab"
                    className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-0.5 h-6 bg-surface-50 rounded-full`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Student View */}
        <div className="px-2 pb-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-500 hover:text-surface-50 hover:bg-surface-800 transition-all text-sm"
          >
            <BookOpenCheck className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  {t('nav.viewAsStudent')}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* User section */}
        <div className="p-3 border-t border-surface-800 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-800 transition-all group">
              {user?.profile?.avatarUrl ? (
                <img src={user.profile.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user?.profile?.firstName?.charAt(0) || 'A'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-50 truncate">{user?.profile?.firstName} {user?.profile?.lastName}</p>
                <p className="text-xs text-amber-500/80 truncate">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="text-surface-500 hover:text-error transition-colors shrink-0 flex items-center gap-2" title={t('nav.logout')}>
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-medium">{t('nav.logout', 'Logout')}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 rounded-xl text-surface-500 hover:text-error hover:bg-surface-800 transition-all"
              title={t('nav.logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute bottom-20 ${isRtl ? 'left-0 translate-x-1/2' : 'right-0 translate-x-1/2'} w-6 h-6 rounded-full bg-surface-700 border border-surface-600 flex items-center justify-center text-surface-400 hover:text-surface-50 transition-all z-10`}
        >
          <ChevronRight className={cn('w-3 h-3 transition-transform', sidebarOpen ? (isRtl ? '' : 'rotate-180') : (isRtl ? 'rotate-180' : ''))} />
        </button>
      </motion.aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="h-16 glass border-b border-surface-800 flex items-center px-6 sticky top-0 z-40 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-surface-400 hover:text-surface-50 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-sm font-medium text-surface-400 flex-1">
            {navItems.find(n => n.href === location.pathname)?.label || t('admin.title')}
          </h1>
          <LanguageSwitcher />
          <NotificationBell />
          <Link to="/profile" className="w-9 h-9 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
            {user?.profile?.avatarUrl ? (
              <img src={user.profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.profile?.firstName?.charAt(0) || 'A'
            )}
          </Link>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
