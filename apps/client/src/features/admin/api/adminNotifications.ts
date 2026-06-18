import api from '../../../lib/api';

export interface SendNotificationPayload {
  userId?: string;
  title: string;
  message: string;
  link?: string;
}

export const adminNotificationsApi = {
  send: async (payload: SendNotificationPayload) => {
    const { data } = await api.post('/admin/notifications/send', payload);
    return data;
  }
};
