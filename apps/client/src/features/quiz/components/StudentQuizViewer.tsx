import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { studentCoursesApi } from './api/student.courses';
import { CheckCircle2, XCircle, AlertCircle, Trophy, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import confetti from 'canvas-confetti';

export default function StudentQuizViewer({ lessonId, onComplete }: { lessonId: string, onComplete?: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<any>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['student-quiz', lessonId],
    queryFn: () => studentCoursesApi.getQuiz(lessonId),
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const formattedAnswers = Object.entries(answers).map(([questionId, optionIds]) => ({
        questionId,
        optionIds,
      }));
      return studentCoursesApi.submitQuiz(quiz.id, formattedAnswers);
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.isPassed) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#fbbf24', '#3b82f6']
        });
        onComplete?.();
      }
    }
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20 text-surface-400">
      <Loader2 className="w-10 h-10 animate-spin mb-4 text-amber-500" />
      <p>جاري تحميل الاختبار...</p>
    </div>
  );

  if (!quiz) return (
    <div className="flex flex-col items-center justify-center p-20 text-surface-400">
      <AlertCircle className="w-12 h-12 mb-4 text-surface-600" />
      <p>هذا الاختبار قيد المراجعة أو لا يحتوي على أسئلة بعد.</p>
    </div>
  );

  const toggleAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      // Currently assuming single choice for simplicity, if multiple choice is needed we'd check question type
      return { ...prev, [questionId]: [optionId] };
    });
  };

  const isAllAnswered = quiz.questions?.every((q: any) => (answers[q.id]?.length || 0) > 0);

  if (result) {
    return (
      <div className="max-w-3xl mx-auto py-12" dir="rtl">
        <div className="bg-surface-900 border border-surface-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Background decoration */}
          <div className={cn(
            "absolute inset-0 opacity-10",
            result.isPassed ? "bg-gradient-to-br from-emerald-500 to-emerald-900" : "bg-gradient-to-br from-red-500 to-red-900"
          )} />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl",
              result.isPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              {result.isPassed ? <Trophy className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">
              {result.isPassed ? 'مبروك! لقد اجتزت الاختبار' : 'للأسف، لم تجتز الاختبار'}
            </h2>
            <p className="text-surface-400 text-lg mb-8">
              لقد حصلت على نسبة <strong className={result.isPassed ? "text-emerald-400" : "text-red-400"}>{Math.round(result.score)}%</strong>
              <span className="text-sm opacity-70 block mt-2">
                (درجة النجاح المطلوبة: {quiz.passingScore}%)
              </span>
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
                className="px-6 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl transition-all font-medium"
              >
                إعادة الاختبار
              </button>
              
              {result.isPassed && (
                <button 
                  onClick={onComplete}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all font-bold flex items-center gap-2"
                >
                  متابعة الكورس
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8" dir="rtl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{quiz.title}</h1>
          {quiz.description && <p className="text-surface-400">{quiz.description}</p>}
        </div>
        <div className="bg-surface-800/50 px-4 py-2 rounded-xl text-center">
          <span className="block text-xs text-surface-500">الأسئلة</span>
          <span className="block font-bold text-white text-lg">{quiz.questions?.length || 0}</span>
        </div>
      </div>

      <div className="space-y-8">
        {quiz.questions?.map((q: any, i: number) => (
          <div key={q.id} className="bg-surface-900 border border-surface-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0 shadow-inner">
                {i + 1}
              </div>
              <h3 className="text-xl font-medium text-white leading-relaxed pt-1">
                {q.question}
              </h3>
            </div>

            <div className="space-y-3 pl-14">
              {q.options?.map((opt: any) => {
                const isSelected = answers[q.id]?.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleAnswer(q.id, opt.id)}
                    className={cn(
                      "w-full text-right p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4",
                      isSelected 
                        ? "bg-amber-500/10 border-amber-500 text-white" 
                        : "bg-surface-950 border-surface-800 text-surface-300 hover:border-surface-600 hover:bg-surface-800"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "border-amber-500" : "border-surface-600"
                    )}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                    </div>
                    <span className="text-lg">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-end">
        <button
          onClick={() => submitMutation.mutate()}
          disabled={!isAllAnswered || submitMutation.isPending}
          className="flex items-center gap-2 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-surface-800 disabled:text-surface-500 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-emerald-900/20"
        >
          {submitMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          {submitMutation.isPending ? 'جاري التصحيح...' : 'تسليم الاختبار'}
        </button>
      </div>
    </div>
  );
}
