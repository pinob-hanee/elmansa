import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PlayCircle, Clock, BookOpen, Layers, CheckCircle2, FileText, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentCoursesApi } from '../../features/courses/api/student.courses';

export default function CourseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => studentCoursesApi.getCourse(slug!),
  });

  const enrollMutation = useMutation({
    mutationFn: () => studentCoursesApi.enroll(course.id),
    onSuccess: () => {
      toast.success('تم التسجيل بنجاح!');
      queryClient.invalidateQueries({ queryKey: ['course', slug] });
      const firstLesson = course?.modules?.[0]?.chapters?.[0]?.lessons?.[0];
      if (firstLesson) {
        navigate(`/courses/${slug}/lesson/${firstLesson.id}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء التسجيل');
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-64 bg-surface-900 rounded-3xl" />
        <div className="h-32 bg-surface-900 rounded-2xl" />
      </div>
    );
  }

  if (!course) return <div className="text-white text-center py-20">كورس غير موجود</div>;

  const isEnrolled = course.isEnrolled;
  const isCompleted = course.enrollmentStatus === 'COMPLETED';
  const firstLesson = course?.modules?.[0]?.chapters?.[0]?.lessons?.[0];

  const handleMainButton = () => {
    if (isEnrolled && firstLesson) {
      navigate(`/courses/${slug}/lesson/${firstLesson.id}`);
    } else if (isEnrolled && !firstLesson) {
      toast.error('لا توجد دروس متاحة في هذا الكورس حالياً');
    } else {
      enrollMutation.mutate();
    }
  };

  const buttonLabel = () => {
    if (enrollMutation.isPending) return 'جاري التحميل...';
    if (isCompleted) return 'مراجعة الكورس مرة أخرى';
    if (isEnrolled) return 'متابعة التعلم';
    return 'ابدأ التعلم الآن';
  };

  return (
    <div dir="rtl" className="max-w-5xl mx-auto pb-20">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden glass border border-white/5 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-surface-950 via-surface-950/80 to-transparent z-10" />
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
        ) : (
          <div className="absolute inset-0 bg-surface-800" />
        )}
        
        <div className="relative z-20 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-sm font-medium border border-primary-500/20">
                {course.category?.name || 'عام'}
              </span>
              <span className="text-surface-400 text-sm flex items-center gap-1">
                <Layers className="w-4 h-4" />
                {course.level === 'BEGINNER' ? 'مبتدئ' : course.level === 'INTERMEDIATE' ? 'متوسط' : course.level === 'ADVANCED' ? 'متقدم' : 'جميع المستويات'}
              </span>
              {isCompleted && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  مكتمل
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              {course.title}
            </h1>
            <p className="text-surface-300 text-lg mb-8 max-w-2xl leading-relaxed">
              {course.description}
            </p>

            <div className="flex items-center gap-6 text-surface-400 mb-8">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{course.modules?.length || 0} وحدات</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>الوصول مدى الحياة</span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleMainButton}
                disabled={enrollMutation.isPending}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary-500/20 disabled:opacity-50"
              >
                {buttonLabel()}
                <PlayCircle className="w-6 h-6" />
              </button>

              {/* Show certificate link if completed */}
              {isCompleted && (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold transition-all"
                >
                  <Award className="w-5 h-5" />
                  عرض الشهادة
                </Link>
              )}
            </div>
          </div>

          <div className="w-full md:w-80 glass rounded-2xl p-6 border border-white/5 shrink-0 bg-surface-900/50 backdrop-blur-xl">
            <h3 className="font-bold text-white text-xl mb-4">هذا الكورس يتضمن:</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-surface-300">
                <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" />
                <span>شرح فيديو عالي الجودة</span>
              </li>
              <li className="flex items-center gap-3 text-surface-300">
                <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" />
                <span>ملفات PDF ومراجع للتنزيل</span>
              </li>
              <li className="flex items-center gap-3 text-surface-300">
                <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" />
                <span>اختبارات لتقييم مستواك</span>
              </li>
              <li className="flex items-center gap-3 text-surface-300">
                <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" />
                <span>شهادة إتمام بنهاية الكورس</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-white mb-6">محتوى الكورس</h2>
        <div className="space-y-4">
          {course.modules?.map((module: any, index: number) => (
            <div key={module.id} className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-5 bg-surface-800/50 flex items-center justify-between">
                <h3 className="font-bold text-white">الوحدة {index + 1}: {module.title}</h3>
              </div>
              <div className="p-3 divide-y divide-surface-800/50">
                {module.chapters?.map((chapter: any) => (
                  <div key={chapter.id} className="p-2 space-y-2">
                    <h4 className="text-sm font-medium text-surface-400 mb-2">{chapter.title}</h4>
                    {chapter.lessons?.map((lesson: any) => (
                      <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-800/50 transition-colors">
                        {lesson.type === 'VIDEO' ? (
                          <PlayCircle className="w-5 h-5 text-primary-500 shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-purple-500 shrink-0" />
                        )}
                        <span className="flex-1 text-surface-200">{lesson.title}</span>
                        {lesson.isFree && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/20 text-success border border-success/20">
                            مجاني
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
