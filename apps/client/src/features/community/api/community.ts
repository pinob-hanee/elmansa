import api from '../../../lib/api';

export interface PostParams {
  page?: number;
  limit?: number;
  courseId?: string;
  type?: string;
  search?: string;
}

export const communityApi = {
  getPosts: async (params?: PostParams) => {
    const { data } = await api.get('/community/posts', { params });
    return data;
  },

  createPost: async (payload: { title?: string; content: string; type?: string; imageUrls?: string[]; hashtags?: string[]; courseId?: string }) => {
    const { data } = await api.post('/community/posts', payload);
    return data.data;
  },

  deletePost: async (id: string) => {
    const { data } = await api.delete(`/community/posts`, { data: { postId: id } });
    return data.data;
  },

  pinPost: async (id: string) => {
    const { data } = await api.patch(`/community/posts/pin`, { postId: id });
    return data.data;
  },

  addComment: async (postId: string, payload: { content: string; parentId?: string }) => {
    const { data } = await api.post(`/community/posts/comments`, { postId, ...payload });
    return data.data;
  },

  toggleReaction: async (payload: { postId?: string; commentId?: string; type: string }) => {
    const { data } = await api.post('/community/reactions', payload);
    return data.data;
  },

  reportPost: async (payload: { targetId: string; postId?: string; reason: string; details?: string }) => {
    const { data } = await api.post('/community/reports', payload);
    return data.data;
  },

  getComments: async (postId: string, params?: { page?: number; limit?: number }) => {
    const { data } = await api.get(`/community/posts/comments`, { params: { postId, ...params } });
    return data;
  },

  getNotifications: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get('/community/notifications', { params });
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await api.get('/community/notifications/unread-count');
    return data.data.count as number;
  },

  markAsRead: async (notificationId: string) => {
    const { data } = await api.patch(`/community/notifications/read`, { notificationId });
    return data.data;
  },
};
