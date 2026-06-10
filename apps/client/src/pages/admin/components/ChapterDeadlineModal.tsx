import React, { useState } from 'react';
import { X, Calendar, Search, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCoursesApi } from '../../../features/courses/api/admin.courses';
import { cn } from '../../../lib/utils';
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

  const [activeTab, setActiveTab] = useState<'global' | 'students'>('global');
  const [globalDeadline, setGlobalDeadline] = useState(
    currentDeadline ? new Date(currentDeadline).toISOString().slice(0, 16) : ''
  );
  
  // Local state for the individual date pickers keyed by userId
  const [studentEdits, setStudentEdits] = useState<Record<string, string>>({});

  const { data: studentDeadlines, isLoading: loadingDeadlines } = useQuery({
    queryKey: ['chapter-deadlines', chapterId],
    queryFn: () => adminCoursesApi.getStudentDeadlines(chapterId),
  });

  const updateGlobalMutation = useMutation({
    mutationFn: (deadline: string | null) => adminCoursesApi.updateChapterDeadline(chapterId, deadline),
    onSuccess: () => {
      toast.success(isRtl ? 'تم تحديث الموعد النهائي العام' : 'Global deadline updated');
      qc.invalidateQueries({ queryKey: ['course-admin', courseId] });
      onClose();
    },
  });

  const setStudentDeadlineMutation = useMutation({
    mutationFn: ({ userId, deadline }: { userId: string; deadline: string | null }) => {
      return adminCoursesApi.setStudentDeadline(chapterId, userId, deadline ? new Date(deadline).toISOString() : null);
    },
    onSuccess: () => {
      toast.success(isRtl ? 'تم تحديث موعد الطالب بنجاح' : 'Student deadline updated');
      qc.invalidateQueries({ queryKey: ['chapter-deadlines', chapterId] });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-2xl bg-surface-950 rounded-2xl border border-surface-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-800 bg-surface-900/50">
          <h2 className="text-lg font-bold text-surface-50 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-400" />
            {isRtl ? 'إدارة المواعيد النهائية' : 'Manage Deadlines'}
          </h2>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-50 rounded-lg hover:bg-surface-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-800">
          <button
            onClick={() => setActiveTab('global')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'global' ? 'border-b-2 border-primary-500 text-surface-50' : 'text-surface-400 hover:text-surface-50 hover:bg-surface-800/50'
            )}
          >
            {isRtl ? 'الموعد العام' : 'Global Deadline'}
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'students' ? 'border-b-2 border-primary-500 text-surface-50' : 'text-surface-400 hover:text-surface-50 hover:bg-surface-800/50'
            )}
          >
            {isRtl ? 'مواعيد الطلاب' : 'Student Deadlines'}
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* GLOBAL TAB */}
          {activeTab === 'global' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-surface-50 mb-1">{isRtl ? 'الموعد النهائي للفصل' : 'Chapter Deadline'}</h3>
                <p className="text-sm text-surface-400">{isRtl ? 'الموعد الافتراضي لجميع الطلاب' : 'Default deadline for all students'}</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={globalDeadline}
                  onChange={e => setGlobalDeadline(e.target.value)}
                  className="flex-1 bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-surface-50 text-sm focus:outline-none focus:border-primary-500"
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
          )}

          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-surface-50 mb-1">{isRtl ? 'مواعيد الطلاب المستقلة' : 'Individual Student Deadlines'}</h3>
                <p className="text-sm text-surface-400">
                  {isRtl 
                    ? 'يتم تعيين موعد تلقائي 3 أيام من بدء الطالب. يمكنك تعديله أو إعادة تعيينه ليتم احتسابه من جديد.' 
                    : 'A 3-day deadline is automatically set when they start. Modify or reset it here.'}
                </p>
              </div>

              {loadingDeadlines ? (
                <div className="text-center text-surface-500 text-sm py-8">{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
              ) : studentDeadlines?.length > 0 ? (
                <div className="space-y-3">
                  {studentDeadlines.map((d: any) => {
                    const hasCustomDeadline = !!d.deadline;
                    const initialDateStr = hasCustomDeadline ? new Date(d.deadline).toISOString().slice(0, 16) : '';
                    const editVal = studentEdits[d.userId] !== undefined ? studentEdits[d.userId] : initialDateStr;

                    return (
                      <div key={d.userId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-900 border border-surface-800 rounded-xl gap-4">
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-primary-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-surface-50">{d.user?.profile?.firstName} {d.user?.profile?.lastName}</p>
                            <p className="text-xs text-surface-500">{d.user?.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                          <input
                            type="datetime-local"
                            value={editVal}
                            onChange={e => setStudentEdits({ ...studentEdits, [d.userId]: e.target.value })}
                            className="bg-surface-950 border border-surface-700 rounded-lg px-3 py-1.5 text-surface-50 text-sm focus:outline-none focus:border-primary-500"
                          />
                          <button
                            onClick={() => setStudentDeadlineMutation.mutate({ userId: d.userId, deadline: editVal })}
                            disabled={setStudentDeadlineMutation.isPending || editVal === initialDateStr}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-all disabled:opacity-50"
                          >
                            {isRtl ? 'حفظ' : 'Save'}
                          </button>
                          
                          {hasCustomDeadline && (
                            <button
                              onClick={() => setStudentDeadlineMutation.mutate({ userId: d.userId, deadline: null })}
                              disabled={setStudentDeadlineMutation.isPending}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all"
                              title={isRtl ? 'إعادة تعيين (حذف الموعد)' : 'Reset deadline'}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-sm text-surface-500 py-12 border-2 border-dashed border-surface-800 rounded-2xl">
                  <AlertCircle className="w-8 h-8 mb-2 text-surface-600" />
                  {isRtl ? 'لا يوجد طلاب مسجلين في هذا الكورس' : 'No students enrolled in this course'}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
