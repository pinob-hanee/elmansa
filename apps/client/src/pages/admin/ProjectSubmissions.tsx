import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCoursesApi } from '../../features/courses/api/admin.courses';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Clock, Link as LinkIcon, FileText, Code2, AlertCircle, X, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminProjectSubmissions() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const qc = useQueryClient();

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [checklistScores, setChecklistScores] = useState<Record<string, number>>({});

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['admin-submissions'],
    queryFn: () => adminCoursesApi.getAllSubmissions(),
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, status, score }: { submissionId: string; status: 'GRADED' | 'REJECTED'; score: number }) => {
      return adminCoursesApi.gradeSubmission(submissionId, {
        status,
        score,
        feedback,
        checklistScores,
      });
    },
    onSuccess: () => {
      toast.success(t('adminCourses.gradeSaved', 'Grade saved successfully'));
      qc.invalidateQueries({ queryKey: ['admin-submissions'] });
      setSelectedSubmission(null);
    },
  });

  const handleGrade = (status: 'GRADED' | 'REJECTED') => {
    if (!selectedSubmission) return;
    const score = Object.values(checklistScores).reduce((a, b) => a + b, 0);
    gradeMutation.mutate({ submissionId: selectedSubmission.id, status, score });
  };

  const openGradingModal = (sub: any) => {
    setSelectedSubmission(sub);
    setFeedback(sub.feedback || '');
    if (sub.checklistScores) {
      setChecklistScores(sub.checklistScores);
    } else {
      const initial: Record<string, number> = {};
      sub.assignment?.checklist?.forEach((c: any) => {
        initial[c.id] = c.maxPoints;
      });
      setChecklistScores(initial);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">{t('adminCourses.projectSubmissions', 'Project Submissions')}</h1>
        <p className="text-surface-400 mt-1">{t('adminCourses.projectSubmissionsDesc', 'Review and grade student assignments.')}</p>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-800/50 text-surface-400">
              <tr>
                <th className="px-6 py-4 font-medium">{t('adminCourses.student', 'Student')}</th>
                <th className="px-6 py-4 font-medium">{t('adminCourses.assignment', 'Assignment')}</th>
                <th className="px-6 py-4 font-medium">{t('common.status', 'Status')}</th>
                <th className="px-6 py-4 font-medium">{t('adminCourses.score', 'Score')}</th>
                <th className="px-6 py-4 font-medium">{t('adminCourses.date', 'Date')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('common.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800 text-surface-300">
              {submissions?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-surface-500">
                    {t('adminCourses.noSubmissions', 'No pending submissions found')}
                  </td>
                </tr>
              ) : (
                submissions?.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-surface-100">{sub.user?.profile?.firstName} {sub.user?.profile?.lastName}</div>
                      <div className="text-xs text-surface-500">{sub.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-surface-100">{sub.assignment?.title}</div>
                      <div className="text-xs text-surface-500">{sub.assignment?.lesson?.chapter?.module?.course?.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                        sub.status === 'PENDING' ? "text-amber-400 bg-amber-400/10 border-amber-400/20" :
                        sub.status === 'GRADED' ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
                        "text-red-400 bg-red-400/10 border-red-400/20"
                      )}>
                        {sub.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                        {sub.status === 'GRADED' && <CheckCircle className="w-3.5 h-3.5" />}
                        {sub.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                        {t(`adminCourses.status${sub.status}`, sub.status) as string}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {sub.score !== null ? (
                        <span className={cn(
                          "font-bold",
                          sub.score >= sub.assignment?.passingScore ? "text-emerald-400" : "text-red-400"
                        )}>
                          {sub.score} / {sub.assignment?.maxScore}
                        </span>
                      ) : (
                        <span className="text-surface-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-surface-400">
                      {new Date(sub.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openGradingModal(sub)}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-medium transition-colors"
                      >
                        {t('adminCourses.reviewGrade', 'Review & Grade')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-surface-800">
              <div>
                <h2 className="text-xl font-bold text-surface-50">{t('adminCourses.gradingSubmission', 'Grading Submission')}</h2>
                <p className="text-sm text-surface-400">{selectedSubmission.user?.profile?.firstName} - {selectedSubmission.assignment?.title}</p>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="p-2 text-surface-400 hover:text-surface-50 rounded-lg hover:bg-surface-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="flex flex-wrap gap-4">
                {selectedSubmission.repoUrl && (
                  <a href={selectedSubmission.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-xl text-surface-200 transition-colors">
                    <Code2 className="w-4 h-4 text-primary-400" /> Repository <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {selectedSubmission.liveUrl && (
                  <a href={selectedSubmission.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-xl text-surface-200 transition-colors">
                    <LinkIcon className="w-4 h-4 text-emerald-400" /> Live Demo <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {selectedSubmission.fileKey && (
                  <a href={selectedSubmission.fileKey} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-xl text-surface-200 transition-colors">
                    <FileText className="w-4 h-4 text-blue-400" /> Download File
                  </a>
                )}
              </div>

              {selectedSubmission.notes && (
                <div className="bg-surface-950 border border-surface-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">{t('adminCourses.studentNotes', 'Student Notes')}</h4>
                  <p className="text-sm text-surface-200 whitespace-pre-wrap">{selectedSubmission.notes}</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-surface-100">{t('adminCourses.checklistRubric', 'Checklist Rubric')}</h3>
                <div className="space-y-3">
                  {selectedSubmission.assignment?.checklist?.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-surface-800/30 border border-surface-700/50 rounded-xl">
                      <div className="text-sm text-surface-200">{c.criterion}</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          max={c.maxPoints}
                          min={0}
                          value={checklistScores[c.id] || 0}
                          onChange={(e) => setChecklistScores({ ...checklistScores, [c.id]: Number(e.target.value) })}
                          className="w-16 bg-surface-900 border border-surface-700 rounded-lg px-2 py-1 text-center text-primary-400 font-bold"
                        />
                        <span className="text-xs text-surface-500">/ {c.maxPoints}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right text-surface-300">
                  {t('adminCourses.totalScore', 'Total Score')}: <span className="font-bold text-xl text-white ml-2">
                    {Object.values(checklistScores).reduce((a, b) => a + b, 0)} / {selectedSubmission.assignment?.maxScore}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-300">{t('adminCourses.adminFeedback', 'Your Feedback')}</label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-3 text-surface-50 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder={t('adminCourses.adminFeedbackPlaceholder', 'Provide constructive feedback to the student...')}
                />
              </div>

            </div>

            <div className="p-6 border-t border-surface-800 flex justify-end gap-3 bg-surface-900/50 rounded-b-2xl">
              <button
                onClick={() => handleGrade('REJECTED')}
                disabled={gradeMutation.isPending}
                className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-medium"
              >
                {t('common.reject', 'Reject')}
              </button>
              <button
                onClick={() => handleGrade('GRADED')}
                disabled={gradeMutation.isPending}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors font-medium"
              >
                {t('common.approveGrade', 'Approve & Grade')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
