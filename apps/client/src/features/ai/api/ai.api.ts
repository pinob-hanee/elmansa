import api from '../../../lib/api';

export const aiApi = {
  chat: async (message: string, history: { role: 'user' | 'assistant'; content: string }[]) => {
    const res = await api.post('/ai/chat', { message, history });
    return res.data.data as { reply: string };
  }
};
