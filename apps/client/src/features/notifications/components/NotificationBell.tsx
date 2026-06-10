import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';
import { cn } from '../../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(1),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const notifications = data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-surface-800 text-surface-400 hover:text-surface-50 transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-surface-900 border border-surface-800 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-surface-800 flex items-center justify-between">
            <h3 className="font-bold text-surface-50">الإشعارات</h3>
            {unreadCount > 0 && (
              <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded-full font-medium">
                {unreadCount} جديد
              </span>
            )}
          </div>
          
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-surface-500 text-sm">جاري التحميل...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-surface-700 mx-auto mb-3" />
                <p className="text-surface-400 text-sm">لا توجد إشعارات حالياً</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-800">
                {notifications.slice(0, 5).map((notification: any) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-surface-800 transition-colors cursor-pointer flex gap-3",
                      !notification.isRead ? "bg-surface-800/50" : ""
                    )}
                    onClick={() => {
                      if (!notification.isRead) markAsReadMutation.mutate(notification.id);
                      if (notification.link) window.location.href = notification.link;
                    }}
                  >
                    <div className="w-2 h-2 mt-2 rounded-full shrink-0 bg-primary-500" style={{ opacity: notification.isRead ? 0 : 1 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-50 mb-1">{notification.title}</p>
                      <p className="text-xs text-surface-400 line-clamp-2 leading-relaxed">{notification.message}</p>
                      <div className="flex items-center gap-1 mt-2 text-surface-500 text-[10px]">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-surface-800 bg-surface-900/50">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium"
            >
              عرض كل الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
