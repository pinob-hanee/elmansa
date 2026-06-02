import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { notificationsApi } from '../../features/notifications/api/notifications';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', 'page-1'],
    queryFn: () => notificationsApi.getNotifications(1),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (isLoading) {
    return (
      <div dir="rtl" className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-surface-900 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <div dir="rtl" className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-2">الإشعارات</h1>
          <p className="text-surface-400">تابع أحدث التنبيهات والأحداث الخاصة بك</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 text-surface-300 hover:text-white hover:bg-surface-700 transition-all text-sm"
          >
            <CheckCheck className="w-4 h-4" />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {!notifications?.length ? (
        <div className="glass rounded-2xl p-12 text-center border border-white/5">
          <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-surface-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">لا توجد إشعارات</h3>
          <p className="text-surface-400">ستظهر جميع الإشعارات والتنبيهات الخاصة بك هنا</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: any) => (
            <div
              key={notification.id}
              onClick={() => {
                if (!notification.isRead) markAsReadMutation.mutate(notification.id);
                if (notification.link) window.location.href = notification.link;
              }}
              className={cn(
                "glass rounded-2xl p-5 border transition-all cursor-pointer flex gap-4",
                !notification.isRead 
                  ? "border-primary-500/30 bg-primary-500/5" 
                  : "border-white/5 hover:border-white/10"
              )}
            >
              <div className="mt-1">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  !notification.isRead ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-surface-800 text-surface-400"
                )}>
                  <Bell className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h3 className={cn("font-bold", !notification.isRead ? "text-white" : "text-surface-300")}>
                    {notification.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-surface-500 shrink-0 mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                  </div>
                </div>
                <p className="text-surface-400 text-sm leading-relaxed">
                  {notification.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
