import api from '../../../lib/api';

export const studentCoursesApi = {
  getCourses: async (params?: any) => {
    const res = await api.get('/courses', { params });
    return res.data;
  },

  getCourse: async (slug: string) => {
    const res = await api.get(`/courses/${slug}`);
    return res.data.data;
  },

  enroll: async (courseId: string) => {
    const res = await api.post(`/courses/${courseId}/enroll`);
    return res.data.data;
  },

  getLessonVideo: async (lessonId: string) => {
    const res = await api.get(`/courses/lessons/${lessonId}/video`);
    return res.data.data;
  },

  updateProgress: async (lessonId: string, watchedTime: number) => {
    const res = await api.post(`/courses/lessons/${lessonId}/progress`, { watchedTime });
    return res.data.data;
  },

  getQuiz: async (lessonId: string) => {
    const res = await api.get(`/quizzes/lesson/${lessonId}`);
    return res.data.data;
  },

  submitQuiz: async (quizId: string, answers: any[]) => {
    const res = await api.post(`/quizzes/${quizId}/attempt`, { answers });
    return res.data.data;
  },
  
  getCategories: async () => {
    const res = await api.get('/courses/categories');
    return res.data.data;
  }
};
