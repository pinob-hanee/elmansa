import api from '../../../lib/api';

export const gamificationApi = {
  getStats: () => api.get('/gamification/stats').then(r => r.data.data),
  getLeaderboard: () => api.get('/gamification/leaderboard').then(r => r.data.data),
  getAchievements: () => api.get('/gamification/achievements').then(r => r.data.data),
  getCertificates: () => api.get('/gamification/certificates').then(r => r.data.data),
};
