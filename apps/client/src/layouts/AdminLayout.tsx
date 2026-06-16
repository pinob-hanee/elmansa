import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, BarChart3,
  MessageSquare, LogOut, Shield, BookOpenCheck, Code2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import api from '../lib/api';
import LanguageSwitcher from '../components/layout/LanguageSwitcher';
import Logo from '../components/layout/Logo';

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), href: '/admin' },
    { icon: Users, label: t('nav.students'), href: '/admin/students' },
    { icon: BookOpen, label: t('nav.courses'), href: '/admin/courses' },
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
      <aside className={cn('w-64 flex flex-col bg-surface-900 shrink-0 shadow-2xl', isRtl ? 'border-l border-surface-800' : 'border-r border-surface-800')}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-surface-800">
          <Logo size="md" />
          <div>
            <p className="font-extrabold text-surface-50 text-sm">{t('admin.title')}</p>
            <p className="text-xs text-surface-500">Elmansa Admin</p>
          </div>
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm',
                  isActive
                    ? 'bg-surface-800 text-surface-50 border border-surface-700 font-medium'
                    : 'text-surface-400 hover:text-surface-50 hover:bg-surface-800'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
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
            <BookOpenCheck className="w-5 h-5" />
            {t('nav.viewAsStudent')}
          </Link>
        </div>

        {/* User section */}
        <div className="p-3 border-t border-surface-800">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.profile?.firstName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-50 truncate">{user?.profile?.firstName} {user?.profile?.lastName}</p>
              <p className="text-xs text-amber-500/80 truncate">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-surface-500 hover:text-error transition-colors" title={t('nav.logout')}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-16 glass border-b border-surface-800 flex items-center px-6 sticky top-0 z-40 gap-4">
          <h1 className="text-sm font-medium text-surface-400 flex-1">
            {navItems.find(n => n.href === location.pathname)?.label || t('admin.title')}
          </h1>
          <LanguageSwitcher />
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
