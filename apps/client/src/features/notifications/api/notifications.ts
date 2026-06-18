import api from '../../../lib/api';

export const notificationsApi = {
  getNotifications: async (page = 1) => {
    const { data } = await api.get('/notifications', { params: { page } });
    return data.data;
  },

  markAsRead: async (id: string) => {
    const { data } = await api.patch(`/notifications/read`, { notificationId: id });
    return data.data;
  },

  markAllAsRead: async () => {
    const { data } = await api.patch('/notifications/read-all');
    return data.data;
  },
};
