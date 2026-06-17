import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCoursesApi } from '../api/admin.courses';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function AssignmentBuilder({ lessonId, onClose }: { lessonId: string; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [isFinalAssessment, setIsFinalAssessment] = useState(false);
  const [checklist, setChecklist] = useState<{ id: string; criterion: string; maxPoints: number }[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['assignment', lessonId],
    queryFn: () => adminCoursesApi.getAssignment(lessonId),
  });

  useEffect(() => {
    if (data) {
      setTitle(data.title || '');
      setDescription(data.description || '');
      setPassingScore(data.passingScore || 70);
      setIsFinalAssessment(data.lesson?.isFinalAssessment || false);
      setChecklist(data.checklist || []);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const maxScore = checklist.reduce((sum, item) => sum + item.maxPoints, 0);
      return adminCoursesApi.upsertAssignment(lessonId, {
        title,
        description,
        passingScore,
        maxScore,
        checklist,
        isFinalAssessment,
      });
    },
    onSuccess: () => {
      toast.success(t('adminCourses.assignmentSaved', 'Assignment saved successfully'));
      qc.invalidateQueries({ queryKey: ['assignment', lessonId] });
      onClose();
    },
    onError: () => toast.error(t('common.error', 'An error occurred')),
  });

  if (isLoading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <h2 className="text-xl font-bold text-surface-50">{t('adminCourses.assignmentBuilder', 'Assignment Builder')}</h2>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-50 rounded-lg hover:bg-surface-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">{t('adminCourses.assignmentTitle', 'Assignment Title')}</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-2.5 text-surface-50 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                placeholder={t('adminCourses.assignmentTitlePlaceholder', 'e.g. Build a React App')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">{t('adminCourses.assignmentInstructions', 'Instructions (Markdown supported)')}</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6}
                className="w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-2.5 text-surface-50 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-mono text-sm"
              />
            </div>
            
            <div className="flex items-center justify-between bg-surface-800/30 p-4 rounded-xl border border-surface-700/50">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="text-sm font-medium text-surface-200">{t('adminCourses.finalAssessment', 'Final Assessment')}</h4>
                  <p className="text-xs text-surface-400">{t('adminCourses.finalAssessmentDesc', 'If enabled, students must pass this to complete the course.')}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isFinalAssessment} onChange={(e) => setIsFinalAssessment(e.target.checked)} />
                <div className="w-11 h-6 bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-surface-100">{t('adminCourses.reviewChecklist', 'Code Review Checklist')}</h3>
                <p className="text-sm text-surface-400">{t('adminCourses.reviewChecklistDesc', 'Define the rubric you will use to grade this assignment.')}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-surface-300">
                  {t('adminCourses.totalPoints', 'Total')}: <span className="font-bold text-primary-400">{checklist.reduce((s, i) => s + i.maxPoints, 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-surface-400">{t('adminCourses.passingScore', 'Passing Score')}</label>
                  <input
                    type="number"
                    value={passingScore}
                    onChange={e => setPassingScore(Number(e.target.value))}
                    className="w-20 bg-surface-950 border border-surface-800 rounded-lg px-2 py-1 text-center text-surface-50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {checklist.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 bg-surface-950 p-3 rounded-xl border border-surface-800">
                  <span className="text-surface-500 font-mono text-sm w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={item.criterion}
                    onChange={e => {
                      const newChecklist = [...checklist];
                      newChecklist[index].criterion = e.target.value;
                      setChecklist(newChecklist);
                    }}
                    placeholder={t('adminCourses.criterionPlaceholder', 'e.g. Code formatting and cleanliness')}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-surface-100 placeholder-surface-600 px-0"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.maxPoints}
                      onChange={e => {
                        const newChecklist = [...checklist];
                        newChecklist[index].maxPoints = Number(e.target.value);
                        setChecklist(newChecklist);
                      }}
                      className="w-16 bg-surface-900 border border-surface-800 rounded-lg px-2 py-1 text-center text-sm text-surface-100"
                    />
                    <span className="text-xs text-surface-500 mr-2">{t('adminCourses.points', 'pts')}</span>
                    <button
                      onClick={() => setChecklist(checklist.filter((_, i) => i !== index))}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setChecklist([...checklist, { id: Date.now().toString(), criterion: '', maxPoints: 10 }])}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-surface-700 text-surface-400 hover:text-surface-200 hover:border-surface-500 hover:bg-surface-800/30 transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('adminCourses.addCriterion', 'Add Criterion')}
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-surface-800 flex justify-end gap-3 bg-surface-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-surface-700 text-surface-300 hover:bg-surface-800 transition-colors font-medium"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title || checklist.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-colors font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {t('common.save', 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
