import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCoursesApi } from "../../courses/api/admin.courses";
import { Plus, Trash2, Save, X, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/utils';

interface QuizBuilderProps {
  lessonId: string;
  onClose: () => void;
}

export default function QuizBuilder({ lessonId, onClose }: QuizBuilderProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const qc = useQueryClient();
  
  const [title, setTitle] = useState(isRtl ? 'اختبار الدرس' : 'Lesson Quiz');
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Load existing quiz if any
  const { data: existingQuiz, isLoading } = useQuery({
    queryKey: ['admin-quiz', lessonId],
    queryFn: () => adminCoursesApi.getQuiz(lessonId),
  });

  useEffect(() => {
    if (existingQuiz) {
      setTitle(existingQuiz.title || (isRtl ? 'اختبار الدرس' : 'Lesson Quiz'));
      setPassingScore(existingQuiz.passingScore || 70);
      setQuestions(existingQuiz.questions || []);
    } else if (!isLoading && questions.length === 0) {
      setQuestions([{
        question: '',
        type: 'MULTIPLE_CHOICE',
        points: 1,
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false }
        ]
      }]);
    }
  }, [existingQuiz, isLoading]);

  // ── Validation ──────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: string[] = [];

    if (!title.trim()) {
      errs.push(isRtl ? 'عنوان الاختبار مطلوب' : 'Quiz title is required');
    }
    if (passingScore < 1 || passingScore > 100) {
      errs.push(isRtl ? 'درجة النجاح يجب أن تكون بين 1 و 100' : 'Passing score must be between 1 and 100');
    }
    if (questions.length === 0) {
      errs.push(isRtl ? 'يجب إضافة سؤال واحد على الأقل' : 'At least one question is required');
    }

    questions.forEach((q, qi) => {
      if (!q.question?.trim()) {
        errs.push(isRtl ? `السؤال ${qi + 1}: نص السؤال مطلوب` : `Question ${qi + 1}: question text is required`);
      }
      const filledOptions = (q.options || []).filter((o: any) => o.text?.trim());
      if (filledOptions.length < 2) {
        errs.push(isRtl ? `السؤال ${qi + 1}: يجب إضافة خيارين على الأقل` : `Question ${qi + 1}: at least 2 options required`);
      }
      const hasCorrect = (q.options || []).some((o: any) => o.isCorrect && o.text?.trim());
      if (!hasCorrect) {
        errs.push(isRtl ? `السؤال ${qi + 1}: يجب تحديد إجابة صحيحة` : `Question ${qi + 1}: correct answer must be selected`);
      }
    });

    setErrors(errs);
    return errs.length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: () => adminCoursesApi.upsertQuiz(lessonId, { title, passingScore, questions }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-quiz', lessonId] });
      toast.success(isRtl ? 'تم حفظ الاختبار بنجاح!' : 'Quiz saved successfully!');
      onClose();
    },
    onError: () => {
      toast.error(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Failed to save quiz');
    }
  });

  const handleSave = () => {
    if (validate()) saveMutation.mutate();
  };

  const addQuestion = () => {
    setErrors([]);
    setQuestions([
      ...questions,
      {
        question: '',
        type: 'MULTIPLE_CHOICE',
        points: 1,
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false }
        ]
      }
    ]);
  };

  const removeQuestion = (qIndex: number) => {
    setErrors([]);
    setQuestions(questions.filter((_, i) => i !== qIndex));
  };

  const updateQuestion = (qIndex: number, field: string, value: any) => {
    const newQs = [...questions];
    newQs[qIndex] = { ...newQs[qIndex], [field]: value };
    setQuestions(newQs);
  };

  const addOption = (qIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options.push({ text: '', isCorrect: false });
    setQuestions(newQs);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options = newQs[qIndex].options.filter((_: any, i: number) => i !== oIndex);
    setQuestions(newQs);
  };

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    const newQs = [...questions];
    newQs[qIndex].options[oIndex].text = text;
    setQuestions(newQs);
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options = newQs[qIndex].options.map((opt: any, i: number) => ({
      ...opt,
      isCorrect: i === oIndex
    }));
    setQuestions(newQs);
  };

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (isLoading) return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-950 border border-surface-800 rounded-3xl p-12 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-surface-400">{isRtl ? 'جاري تحميل الاختبار...' : 'Loading quiz...'}</p>
      </div>
    </div>,
    document.body
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-950 border border-surface-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-surface-50">{isRtl ? 'بناء الاختبار' : 'Quiz Builder'}</h2>
              <p className="text-sm text-surface-400">{isRtl ? 'أضف الأسئلة وحدد الإجابات الصحيحة' : 'Add questions and set correct answers'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-50 hover:bg-surface-800 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="bg-error/10 border border-error/30 rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-error font-medium mb-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{isRtl ? 'يرجى إصلاح الأخطاء التالية:' : 'Please fix the following errors:'}</span>
              </div>
              {errors.map((e, i) => (
                <p key={i} className="text-error/80 text-sm">{e}</p>
              ))}
            </div>
          )}

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-surface-400 mb-2">
                {isRtl ? 'عنوان الاختبار' : 'Quiz Title'}
              </label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-surface-50 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-surface-400 mb-2">
                {isRtl ? 'درجة النجاح (%)' : 'Passing Score (%)'}
              </label>
              <input 
                type="number" 
                min={1}
                max={100}
                value={passingScore} 
                onChange={e => setPassingScore(Number(e.target.value))}
                className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-surface-50 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="h-px bg-surface-800" />

          {/* Questions */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-surface-50">
                {isRtl ? `الأسئلة (${questions.length})` : `Questions (${questions.length})`}
              </h3>
              <button 
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-sm font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                {isRtl ? 'إضافة سؤال' : 'Add Question'}
              </button>
            </div>

            {questions.length === 0 && (
              <div className="text-center py-12 text-surface-500 border-2 border-dashed border-surface-800 rounded-2xl">
                <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>{isRtl ? 'لا توجد أسئلة بعد. ابدأ بإضافة سؤال.' : 'No questions yet. Start by adding one.'}</p>
              </div>
            )}

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-surface-900/50 border border-surface-700 rounded-2xl p-5 space-y-4">
                {/* Question header */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-400 shrink-0">
                    {qIndex + 1}
                  </div>
                  <input
                    placeholder={isRtl ? 'اكتب السؤال هنا...' : 'Type your question here...'}
                    value={q.question}
                    onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                    className="flex-1 bg-transparent border-b border-surface-700 pb-2 text-surface-50 focus:border-amber-500 focus:outline-none placeholder:text-surface-600 transition-colors"
                  />
                  <button 
                    onClick={() => removeQuestion(qIndex)}
                    className="p-2 text-surface-500 hover:text-error hover:bg-error/10 rounded-lg transition-all shrink-0"
                    title={isRtl ? 'حذف السؤال' : 'Delete question'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                    
                {/* Options */}
                <div className="space-y-2 ps-11">
                  {q.options.map((opt: any, oIndex: number) => (
                    <div key={oIndex} className="flex items-center gap-3">
                      {/* Correct indicator */}
                      <button
                        onClick={() => setCorrectOption(qIndex, oIndex)}
                        title={isRtl ? 'تحديد كإجابة صحيحة' : 'Set as correct answer'}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                          opt.isCorrect 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                            : "border-surface-600 hover:border-emerald-500/50"
                        )}
                      >
                        {opt.isCorrect && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      
                      <input
                        placeholder={isRtl ? `الخيار ${oIndex + 1}` : `Option ${oIndex + 1}`}
                        value={opt.text}
                        onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                        className={cn(
                          "flex-1 rounded-xl px-3 py-2.5 text-sm text-surface-50 focus:outline-none transition-all border",
                          opt.isCorrect 
                            ? "bg-emerald-500/5 border-emerald-500/40 focus:border-emerald-500" 
                            : "bg-surface-800 border-surface-700 focus:border-amber-500/50"
                        )}
                      />
                      
                      {q.options.length > 2 && (
                        <button 
                          onClick={() => removeOption(qIndex, oIndex)} 
                          className="p-1.5 text-surface-500 hover:text-error hover:bg-error/10 rounded-lg transition-all shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => addOption(qIndex)}
                    className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1.5 mt-2 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isRtl ? 'إضافة خيار' : 'Add option'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-800 shrink-0 flex justify-between items-center gap-3">
          <p className="text-xs text-surface-500">
            {isRtl 
              ? `${questions.length} سؤال · درجة النجاح ${passingScore}%`
              : `${questions.length} question(s) · Passing: ${passingScore}%`}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-surface-50 transition-all"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
            >
              {saveMutation.isPending 
                ? <div className="w-4 h-4 border-2 border-surface-300 border-t-primary-500 rounded-full animate-spin" />
                : <Save className="w-4 h-4" />}
              {saveMutation.isPending 
                ? (isRtl ? 'جاري الحفظ...' : 'Saving...') 
                : (isRtl ? 'حفظ الاختبار' : 'Save Quiz')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
