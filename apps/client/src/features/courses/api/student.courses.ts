import api from '../../../lib/api';

export const studentCoursesApi = {
  getCourses: async (params?: any) => {
    const res = await api.get('/courses', { params });
    return res.data;
  },

  getCourse: async (slug: string) => {
    const res = await api.get(`/courses/public/slug`, { params: { slug } });
    return res.data.data;
  },

  enroll: async (courseId: string, code?: string) => {
    const res = await api.post(`/courses/enroll`, { courseId, code });
    return res.data.data;
  },

  getLessonVideo: async (lessonId: string) => {
    const res = await api.get(`/courses/lessons/video`, { params: { lessonId } });
    return res.data.data;
  },

  updateProgress: async (lessonId: string, watchedTime: number) => {
    const res = await api.post(`/courses/lessons/progress`, { lessonId, watchedTime });
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
  },

  getAssignment: async (lessonId: string) => {
    const res = await api.get(`/courses/lessons/assignment`, { params: { lessonId } });
    return res.data.data;
  },

  submitAssignment: async (assignmentId: string, data: any) => {
    const res = await api.post(`/courses/assignments/submit`, { assignmentId, ...data });
    return res.data.data;
  },

  getStudentSubmissions: async () => {
    const res = await api.get(`/courses/users/me/submissions`);
    return res.data.data;
  }
};
