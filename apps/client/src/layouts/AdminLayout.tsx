import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, BarChart3,
  MessageSquare, Settings, LogOut, Shield, BookOpenCheck
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import api from '../lib/api';

const navItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', href: '/admin' },
  { icon: Users, label: 'الطلاب', href: '/admin/students' },
  { icon: BookOpen, label: 'الكورسات', href: '/admin/courses' },
  { icon: MessageSquare, label: 'المجتمع', href: '/admin/community' },
  { icon: BarChart3, label: 'التحليلات', href: '/admin/analytics' },
];

export default function AdminLayout() {
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
      {/* Admin Sidebar */}
      <aside className="w-64 flex flex-col bg-surface-900 border-l border-surface-800 shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-surface-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-white text-sm">لوحة الإدارة</p>
            <p className="text-xs text-surface-500">Elmansa Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm',
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 font-medium'
                    : 'text-surface-400 hover:text-white hover:bg-surface-800'
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-500 hover:text-white hover:bg-surface-800 transition-all text-sm"
          >
            <BookOpenCheck className="w-5 h-5" />
            عرض كطالب
          </Link>
        </div>

        {/* User section */}
        <div className="p-3 border-t border-surface-800">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.profile?.firstName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.profile?.firstName} {user?.profile?.lastName}</p>
              <p className="text-xs text-amber-500/80 truncate">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-surface-500 hover:text-error transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-16 glass border-b border-surface-800 flex items-center px-6 sticky top-0 z-40">
          <h1 className="text-sm font-medium text-surface-400">
            {navItems.find(n => n.href === location.pathname)?.label || 'لوحة الإدارة'}
          </h1>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
