import api from '../../../lib/api';

export const adminCoursesApi = {
  getAdminCourses: async (params?: { search?: string }) => {
    const res = await api.get('/courses/admin/list', { params });
    return res.data;
  },

  getAdminCourse: async (id: string) => {
    const res = await api.get(`/courses/${id}/admin`);
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
    const res = await api.delete(`/courses/${id}`);
    return res.data.data;
  },

  createModule: async (courseId: string, data: any) => {
    const res = await api.post(`/courses/${courseId}/modules`, data);
    return res.data.data;
  },

  createChapter: async (moduleId: string, data: any) => {
    const res = await api.post(`/courses/modules/${moduleId}/chapters`, data);
    return res.data.data;
  },

  createLesson: async (chapterId: string, data: any) => {
    const res = await api.post(`/courses/chapters/${chapterId}/lessons`, data);
    return res.data.data;
  },

  updateLesson: async (lessonId: string, data: any) => {
    const res = await api.put(`/courses/lessons/${lessonId}`, data);
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
    const res = await api.get(`/quiz/lesson/${lessonId}`);
    return res.data.data;
  },

  upsertQuiz: async (lessonId: string, data: any) => {
    const res = await api.put(`/quiz/lesson/${lessonId}`, data);
    return res.data.data;
  }
};
