import React, { useState } from 'react';
import { X, Calendar, Search, Users, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCoursesApi } from '../../../features/courses/api/admin.courses';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

interface ChapterDeadlineModalProps {
  chapterId: string;
  courseId: string;
  currentDeadline: string | null;
  onClose: () => void;
}

export default function ChapterDeadlineModal({ chapterId, courseId, currentDeadline, onClose }: ChapterDeadlineModalProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const qc = useQueryClient();

  const [globalDeadline, setGlobalDeadline] = useState(
    currentDeadline ? new Date(currentDeadline).toISOString().slice(0, 16) : ''
  );
  const [searchEmail, setSearchEmail] = useState('');
  const [studentDeadline, setStudentDeadline] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: studentDeadlines, isLoading: loadingDeadlines } = useQuery({
    queryKey: ['chapter-deadlines', chapterId],
    queryFn: () => adminCoursesApi.getStudentDeadlines(chapterId),
  });

  const updateGlobalMutation = useMutation({
    mutationFn: (deadline: string | null) => adminCoursesApi.updateChapterDeadline(chapterId, deadline),
    onSuccess: () => {
      toast.success(isRtl ? 'تم تحديث الموعد النهائي' : 'Deadline updated');
      qc.invalidateQueries({ queryKey: ['course-admin', courseId] });
      onClose();
    },
  });

  const searchStudentMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await api.get(`/users/search?email=${email}`);
      return res.data.data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setSelectedUserId(data[0].id);
        toast.success(isRtl ? 'تم العثور على الطالب' : 'Student found');
      } else {
        toast.error(isRtl ? 'الطالب غير موجود' : 'Student not found');
      }
    }
  });

  const setStudentDeadlineMutation = useMutation({
    mutationFn: () => {
      if (!selectedUserId || !studentDeadline) return Promise.reject();
      return adminCoursesApi.setStudentDeadline(chapterId, selectedUserId, new Date(studentDeadline).toISOString());
    },
    onSuccess: () => {
      toast.success(isRtl ? 'تم تعيين الاستثناء بنجاح' : 'Student exception set successfully');
      qc.invalidateQueries({ queryKey: ['chapter-deadlines', chapterId] });
      setSelectedUserId(null);
      setStudentDeadline('');
      setSearchEmail('');
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-lg bg-surface-950 rounded-2xl border border-surface-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-surface-800 bg-surface-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-400" />
            {isRtl ? 'إدارة المواعيد النهائية' : 'Manage Deadlines'}
          </h2>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          {/* Global Deadline */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-white mb-1">{isRtl ? 'الموعد النهائي للفصل' : 'Chapter Deadline'}</h3>
              <p className="text-sm text-surface-400">{isRtl ? 'الموعد الافتراضي لجميع الطلاب' : 'Default deadline for all students'}</p>
            </div>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={globalDeadline}
                onChange={e => setGlobalDeadline(e.target.value)}
                className="flex-1 bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={() => updateGlobalMutation.mutate(globalDeadline ? new Date(globalDeadline).toISOString() : null)}
                disabled={updateGlobalMutation.isPending}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm transition-all disabled:opacity-50"
              >
                {isRtl ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>

          <hr className="border-surface-800" />

          {/* Student Exceptions */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-white mb-1">{isRtl ? 'استثناءات الطلاب' : 'Student Exceptions'}</h3>
              <p className="text-sm text-surface-400">{isRtl ? 'تمديد أو تغيير الموعد لطالب محدد' : 'Extend or change deadline for specific student'}</p>
            </div>

            <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-surface-500 absolute top-3 left-3" />
                  <input
                    type="email"
                    placeholder={isRtl ? 'البريد الإلكتروني للطالب' : 'Student Email'}
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <button
                  onClick={() => searchStudentMutation.mutate(searchEmail)}
                  disabled={!searchEmail || searchStudentMutation.isPending}
                  className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-white rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  {isRtl ? 'بحث' : 'Search'}
                </button>
              </div>

              {selectedUserId && (
                <div className="flex gap-2 pt-2 border-t border-surface-800">
                  <input
                    type="datetime-local"
                    value={studentDeadline}
                    onChange={e => setStudentDeadline(e.target.value)}
                    className="flex-1 bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                  />
                  <button
                    onClick={() => setStudentDeadlineMutation.mutate()}
                    disabled={!studentDeadline || setStudentDeadlineMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-all disabled:opacity-50"
                  >
                    {isRtl ? 'إضافة استثناء' : 'Add Exception'}
                  </button>
                </div>
              )}
            </div>

            {loadingDeadlines ? (
              <div className="text-center text-surface-500 text-sm py-4">{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : studentDeadlines?.length > 0 ? (
              <div className="space-y-2">
                {studentDeadlines.map((d: any) => (
                  <div key={d.id} className="flex justify-between items-center p-3 bg-surface-900 border border-surface-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-primary-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{d.user?.profile?.firstName} {d.user?.profile?.lastName}</p>
                        <p className="text-xs text-surface-500">{d.user?.email}</p>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                      {new Date(d.deadline).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-surface-500 py-4 justify-center">
                <AlertCircle className="w-4 h-4" />
                {isRtl ? 'لا توجد استثناءات مسجلة' : 'No exceptions recorded'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
