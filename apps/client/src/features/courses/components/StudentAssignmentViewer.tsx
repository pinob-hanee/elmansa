import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentCoursesApi } from '../api/student.courses';
import { useTranslation } from 'react-i18next';
import { Send, Link as LinkIcon, Code2, FileText, CheckCircle, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import toast from 'react-hot-toast';

export default function StudentAssignmentViewer({ lessonId, onComplete }: { lessonId: string, onComplete: () => void }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const qc = useQueryClient();

  const [repoUrl, setRepoUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [notes, setNotes] = useState('');

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['student-assignment', lessonId],
    queryFn: () => studentCoursesApi.getAssignment(lessonId),
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['student-submissions'],
    queryFn: () => studentCoursesApi.getStudentSubmissions(),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return studentCoursesApi.submitAssignment(assignment.id, {
        repoUrl,
        liveUrl,
        notes,
      });
    },
    onSuccess: () => {
      toast.success(t('studentCourses.assignmentSubmitted', 'Assignment submitted successfully!'));
      qc.invalidateQueries({ queryKey: ['student-submissions'] });
    },
    onError: () => toast.error(t('common.error', 'Failed to submit assignment')),
  });

  if (isLoading || submissionsLoading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!assignment) {
    return <div className="p-12 text-center text-surface-400">{t('studentCourses.noAssignment', 'No assignment found for this lesson.')}</div>;
  }

  // Find latest submission for this assignment
  const mySubmission = submissions?.find((s: any) => s.assignmentId === assignment.id);

  return (
    <div className="w-full h-full bg-surface-950 p-6 md:p-12 overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-surface-50">{assignment.title}</h1>
            {assignment.lesson?.isFinalAssessment && (
              <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold border border-amber-500/20">
                {t('studentCourses.finalAssessment', 'Final Assessment')}
              </span>
            )}
          </div>
          <div className="prose prose-invert max-w-none text-surface-200" dangerouslySetInnerHTML={{ __html: assignment.description }} />
        </div>

        {/* Status Panel */}
        {mySubmission && (
          <div className={cn(
            "p-6 rounded-2xl border",
            mySubmission.status === 'PENDING' ? "bg-amber-400/5 border-amber-400/20" :
            mySubmission.status === 'GRADED' ? "bg-emerald-400/5 border-emerald-400/20" :
            "bg-red-400/5 border-red-400/20"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {mySubmission.status === 'PENDING' && <Clock className="w-6 h-6 text-amber-400" />}
                {mySubmission.status === 'GRADED' && <CheckCircle className="w-6 h-6 text-emerald-400" />}
                {mySubmission.status === 'REJECTED' && <div className="w-6 h-6 text-red-400 font-bold text-center">X</div>}
                
                <div>
                  <h3 className="font-bold text-surface-50">
                    {t(`studentCourses.status${mySubmission.status}`, `Status: ${mySubmission.status}`)}
                  </h3>
                  {mySubmission.status === 'GRADED' && (
                    <p className="text-sm text-surface-400 mt-1">
                      {t('studentCourses.score', 'Score')}: <span className={mySubmission.score >= assignment.passingScore ? 'text-emerald-400' : 'text-red-400'}>{mySubmission.score} / {assignment.maxScore}</span>
                    </p>
                  )}
                </div>
              </div>
              
              {mySubmission.status === 'GRADED' && mySubmission.score >= assignment.passingScore && (
                <button
                  onClick={onComplete}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
                >
                  {t('studentCourses.continueCourse', 'Continue Course')}
                </button>
              )}
            </div>

            {mySubmission.feedback && (
              <div className="mt-6 p-4 bg-surface-950 rounded-xl border border-surface-800">
                <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">{t('studentCourses.reviewerFeedback', 'Reviewer Feedback')}</h4>
                <p className="text-sm text-surface-200">{mySubmission.feedback}</p>
              </div>
            )}
          </div>
        )}

        {/* Submission Form */}
        {(!mySubmission || mySubmission.status === 'REJECTED') && (
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-surface-50 mb-6">{t('studentCourses.submitAssignment', 'Submit Assignment')}</h2>
            
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-1">
                  <Code2 className="w-4 h-4" /> {t('studentCourses.repoUrl', 'Repository URL (GitHub/GitLab)')}
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                  className="w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-3 text-surface-50 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="https://github.com/username/project"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-1">
                  <LinkIcon className="w-4 h-4" /> {t('studentCourses.liveUrl', 'Live Demo URL')}
                </label>
                <input
                  type="url"
                  value={liveUrl}
                  onChange={e => setLiveUrl(e.target.value)}
                  className="w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-3 text-surface-50 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="https://my-project.vercel.app"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-1">
                  <FileText className="w-4 h-4" /> {t('studentCourses.notes', 'Additional Notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-3 text-surface-50 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder={t('studentCourses.notesPlaceholder', 'Any instructions for the reviewer?')}
                />
              </div>

              <div className="pt-4 border-t border-surface-800">
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending || (!repoUrl && !liveUrl)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-colors font-bold disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  {t('studentCourses.submitWork', 'Submit Work')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
