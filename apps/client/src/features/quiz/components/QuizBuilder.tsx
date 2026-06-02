import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCoursesApi } from "../../courses/api/admin.courses";
import { Plus, Trash2, Save, X, HelpCircle, CheckCircle2 } from 'lucide-react';
import toast from "react-hot-toast";
import { cn } from '../../../lib/utils';

interface QuizBuilderProps {
  lessonId: string;
  onClose: () => void;
}

export default function QuizBuilder({ lessonId, onClose }: QuizBuilderProps) {
  const qc = useQueryClient();
  
  const [title, setTitle] = useState('اختبار الدرس');
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<any[]>([]);

  // Load existing quiz if any
  const { data: existingQuiz, isLoading } = useQuery({
    queryKey: ['admin-quiz', lessonId],
    queryFn: () => adminCoursesApi.getQuiz(lessonId),
  });

  useEffect(() => {
    if (existingQuiz) {
      setTitle(existingQuiz.title || 'اختبار الدرس');
      setPassingScore(existingQuiz.passingScore || 70);
      setQuestions(existingQuiz.questions || []);
    } else if (!isLoading && questions.length === 0) {
      // Default empty question
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

  const saveMutation = useMutation({
    mutationFn: () => adminCoursesApi.upsertQuiz(lessonId, { title, passingScore, questions }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-quiz', lessonId] });
      toast.success('تم حفظ الاختبار بنجاح!');
      onClose();
    }
  });

  const addQuestion = () => {
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

  if (isLoading) return <div className="p-8 text-center text-surface-400">جاري تحميل الاختبار...</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-surface-950 border border-surface-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">بناء الاختبار</h2>
              <p className="text-sm text-surface-400">أضف الأسئلة وحدد الإجابات الصحيحة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-surface-400 mb-2">عنوان الاختبار</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-surface-400 mb-2">درجة النجاح (%)</label>
              <input 
                type="number" 
                value={passingScore} 
                onChange={e => setPassingScore(Number(e.target.value))}
                className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="h-px bg-surface-800" />

          {/* Questions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">الأسئلة ({questions.length})</h3>
              <button 
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-surface-800 hover:bg-surface-700 text-white rounded-lg text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                إضافة سؤال
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-surface-900/50 border border-surface-800 rounded-2xl p-5 relative group">
                <button 
                  onClick={() => removeQuestion(qIndex)}
                  className="absolute top-4 left-4 p-2 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex gap-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-sm font-bold text-surface-400 shrink-0">
                    {qIndex + 1}
                  </div>
                  <div className="flex-1 space-y-4">
                    <input
                      placeholder="اكتب السؤال هنا..."
                      value={q.question}
                      onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                      className="w-full bg-transparent border-b border-surface-700 pb-2 text-lg text-white focus:border-amber-500 focus:outline-none placeholder:text-surface-600"
                    />
                    
                    <div className="space-y-2">
                      {q.options.map((opt: any, oIndex: number) => (
                        <div key={oIndex} className="flex items-center gap-3">
                          <button
                            onClick={() => setCorrectOption(qIndex, oIndex)}
                            className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                              opt.isCorrect ? "bg-emerald-500 border-emerald-500 text-white" : "border-surface-600 text-transparent hover:border-emerald-500/50"
                            )}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          
                          <input
                            placeholder={`الخيار ${oIndex + 1}`}
                            value={opt.text}
                            onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                            className={cn(
                              "flex-1 bg-surface-800 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-all",
                              opt.isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-surface-700 focus:border-surface-500"
                            )}
                          />
                          
                          {q.options.length > 2 && (
                            <button onClick={() => removeOption(qIndex, oIndex)} className="p-2 text-surface-500 hover:text-red-400">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => addOption(qIndex)}
                      className="text-amber-400 text-sm hover:text-amber-300 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إضافة خيار
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-800 shrink-0 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white transition-all">
            إلغاء
          </button>
          <button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || questions.length === 0}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ الاختبار'}
          </button>
        </div>
      </div>
    </div>
  );
}
