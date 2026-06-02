import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Home, Compass, Users, Bell, User,
  Menu, X, LogOut, ChevronRight, Terminal
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import api from '../lib/api';
import NotificationBell from '../features/notifications/components/NotificationBell';

const navItems = [
  { icon: Home, label: 'الرئيسية', href: '/dashboard' },
  { icon: Terminal, label: 'الكورسات', href: '/courses' },
  { icon: Users, label: 'المجتمع', href: '/community' },
  { icon: Bell, label: 'الإشعارات', href: '/notifications' },
  { icon: User, label: 'ملفي', href: '/profile' },
];

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden" dir="rtl">
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
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary-500 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-surface-800 shrink-0">
          {sidebarOpen ? (
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
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
          className="absolute bottom-20 left-0 translate-x-1/2 w-6 h-6 rounded-full bg-surface-700 border border-surface-600 flex items-center justify-center text-surface-400 hover:text-white transition-all z-10"
        >
          <ChevronRight className={cn('w-3 h-3 transition-transform', sidebarOpen ? 'rotate-180' : '')} />
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
