import api from '../../../lib/api';

export const adminCoursesApi = {
  getAdminCourses: async (params?: { search?: string }) => {
    const res = await api.get('/courses/admin/list', { params });
    return res.data;
  },

  getAdminCourse: async (id: string) => {
    const res = await api.get(`/courses/admin`, { params: { courseId: id } });
    return res.data.data;
  },

  createCourse: async (data: any) => {
    const res = await api.post('/courses', data);
    return res.data.data;
  },
  
  updateCourse: async (id: string, data: any) => {
    const res = await api.put(`/courses/${id}`, data);
    return res.data.data;
  },

  deleteCourse: async (id: string) => {
    const res = await api.delete(`/courses`, { data: { courseId: id } });
    return res.data.data;
  },

  createModule: async (courseId: string, data: any) => {
    const res = await api.post(`/courses/modules`, { courseId, ...data });
    return res.data.data;
  },

  createChapter: async (moduleId: string, data: any) => {
    const res = await api.post(`/courses/chapters`, { moduleId, ...data });
    return res.data.data;
  },

  deleteChapter: async (chapterId: string) => {
    const res = await api.delete(`/courses/chapters`, { data: { chapterId } });
    return res.data.data;
  },

  moveChapter: async (chapterId: string, moduleId: string) => {
    const res = await api.patch(`/courses/chapters/move`, { chapterId, moduleId });
    return res.data.data;
  },

  createLesson: async (chapterId: string, data: any) => {
    const res = await api.post(`/courses/lessons`, { chapterId, ...data });
    return res.data.data;
  },

  updateLesson: async (lessonId: string, data: any) => {
    const res = await api.put(`/courses/lessons`, { lessonId, ...data });
    return res.data.data;
  },

  deleteLesson: async (lessonId: string) => {
    const res = await api.delete(`/courses/lessons`, { data: { lessonId } });
    return res.data.data;
  },

  reorderLessons: async (chapterId: string, lessonIds: string[]) => {
    const res = await api.put(`/courses/lessons/reorder`, { chapterId, lessonIds });
    return res.data.data;
  },

  updateChapterDeadline: async (chapterId: string, deadline: string | null) => {
    const res = await api.put(`/courses/chapters/deadline`, { chapterId, deadline });
    return res.data.data;
  },

  getStudentDeadlines: async (chapterId: string) => {
    const res = await api.get(`/courses/chapters/student-deadlines`, { params: { chapterId } });
    return res.data.data;
  },

  setStudentDeadline: async (chapterId: string, userId: string, deadline: string | null) => {
    const res = await api.post(`/courses/chapters/student-deadlines`, { chapterId, userId, deadline });
    return res.data.data;
  },

  uploadMedia: async (file: File, type: 'video' | 'file', onUploadProgress?: (progressEvent: any) => void) => {
    const formData = new FormData();
    formData.append(type === 'video' ? 'video' : 'file', file);
    
    // Uses the /media/video or /media/file endpoint
    const res = await api.post(`/media/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return res.data.data;
  },

  getQuiz: async (lessonId: string) => {
    const res = await api.get(`/quizzes/lesson/${lessonId}`);
    return res.data.data;
  },

  upsertQuiz: async (lessonId: string, data: any) => {
    const res = await api.put(`/quizzes/lesson/${lessonId}`, data);
    return res.data.data;
  },

  getAssignment: async (lessonId: string) => {
    const res = await api.get(`/courses/lessons/assignment`, { params: { lessonId } });
    return res.data.data;
  },

  upsertAssignment: async (lessonId: string, data: any) => {
    const res = await api.put(`/courses/lessons/assignment`, { lessonId, ...data });
    return res.data.data;
  },

  getAllSubmissions: async () => {
    const res = await api.get(`/courses/admin/submissions`);
    return res.data.data;
  },

  gradeSubmission: async (submissionId: string, data: any) => {
    const res = await api.put(`/courses/admin/submissions/grade`, { submissionId, ...data });
    return res.data.data;
  },

  getAccessCodes: async (courseId: string) => {
    const res = await api.get(`/courses/access-codes`, { params: { courseId } });
    return res.data.data;
  },

  generateAccessCode: async (courseId: string, email: string) => {
    const res = await api.post(`/courses/access-codes`, { courseId, email });
    return res.data.data;
  }
};
