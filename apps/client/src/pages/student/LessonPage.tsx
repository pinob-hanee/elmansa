import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowRight, Menu, X, PlayCircle, FileText, CheckCircle2, HelpCircle } from 'lucide-react';
import { studentCoursesApi } from '../../features/courses/api/student.courses';
import StudentQuizViewer from '../../features/quiz/components/StudentQuizViewer';
import { cn } from '../../lib/utils';

export default function LessonPage() {
  const { slug, lessonId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => studentCoursesApi.getCourse(slug!),
  });

  const { data: videoData, isLoading: videoLoading } = useQuery({
    queryKey: ['lesson-video', lessonId],
    queryFn: () => studentCoursesApi.getLessonVideo(lessonId!),
  });

  const updateProgressMutation = useMutation({
    mutationFn: (watchedTime: number) => studentCoursesApi.updateProgress(lessonId!, watchedTime),
    onSuccess: (data) => {
      if (data?.xpEarned > 0) {
        import('react-hot-toast').then(toast => {
          toast.default.success(`مبروك! أكملت الدرس وربحت ${data.xpEarned} XP 🌟`, { duration: 4000 });
        });
      }
    }
  });

  // Find current lesson details to get title/type
  let currentLesson: any = null;
  course?.modules?.forEach((m: any) => {
    m.chapters?.forEach((c: any) => {
      c.lessons?.forEach((l: any) => {
        if (l.id === lessonId) currentLesson = l;
      });
    });
  });

  if (courseLoading) return <div className="p-8 text-center text-white">جاري التحميل...</div>;
  if (!course) return <div className="p-8 text-center text-white">لم يتم العثور على الكورس</div>;

  return (
    <div dir="rtl" className="h-screen flex flex-col bg-surface-950 overflow-hidden">
      {/* Header */}
      <header className="h-16 shrink-0 glass border-b border-surface-800 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/courses/${slug}`)}
            className="p-2 text-surface-400 hover:text-white transition-colors rounded-lg hover:bg-surface-800"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-surface-800" />
          <h1 className="font-bold text-white line-clamp-1">{course.title}</h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 text-surface-400 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-black relative">
          {currentLesson?.type === 'QUIZ' ? (
            <div className="w-full h-full bg-surface-950 overflow-y-auto">
              <StudentQuizViewer 
                lessonId={lessonId!} 
                onComplete={() => {
                  updateProgressMutation.mutate(currentLesson?.videoDuration || 1000);
                }} 
              />
            </div>
          ) : videoLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : videoData?.url ? (
            <div className="w-full h-full lg:max-h-[80vh] bg-black">
              <video
                src={videoData.url}
                controls
                controlsList="nodownload"
                className="w-full h-full outline-none"
                onEnded={(e) => {
                  const target = e.target as HTMLVideoElement;
                  updateProgressMutation.mutate(target.duration || currentLesson?.videoDuration || 1000);
                }}
              >
                متصفحك لا يدعم مشغل الفيديو.
              </video>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-surface-400">
              لا يوجد فيديو لهذا الدرس
            </div>
          )}
          
          {currentLesson?.type !== 'QUIZ' && (
            <div className="p-6 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">{currentLesson?.title}</h2>
              {/* Description or attachments would go here */}
            </div>
          )}
        </main>

        {/* Sidebar (Curriculum) */}
        <aside
          className={cn(
            "absolute lg:static inset-y-0 right-0 w-80 bg-surface-900 border-l border-surface-800 z-10 transition-transform duration-300 flex flex-col",
            sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          )}
        >
          <div className="p-4 border-b border-surface-800 shrink-0">
            <h3 className="font-bold text-white">محتوى الكورس</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {course.modules?.map((module: any, mIdx: number) => (
              <div key={module.id} className="space-y-1">
                <div className="px-2 py-1.5 text-xs font-bold text-surface-400 uppercase">
                  الوحدة {mIdx + 1}: {module.title}
                </div>
                {module.chapters?.map((chapter: any) => (
                  <div key={chapter.id} className="space-y-1">
                    {chapter.lessons?.map((lesson: any) => {
                      const isActive = lesson.id === lessonId;
                      // const isCompleted = false; // Add progress logic later
                      
                      return (
                        <Link
                          key={lesson.id}
                          to={`/courses/${slug}/lesson/${lesson.id}`}
                          className={cn(
                            "flex items-start gap-3 p-2.5 rounded-xl transition-colors",
                            isActive 
                              ? "bg-primary-500/10 border border-primary-500/20" 
                              : "hover:bg-surface-800 border border-transparent"
                          )}
                        >
                          <div className="mt-0.5">
                            {lesson.type === 'VIDEO' ? (
                              <PlayCircle className={cn("w-4 h-4", isActive ? "text-primary-400" : "text-surface-500")} />
                            ) : lesson.type === 'QUIZ' ? (
                              <HelpCircle className={cn("w-4 h-4", isActive ? "text-amber-400" : "text-surface-500")} />
                            ) : (
                              <FileText className={cn("w-4 h-4", isActive ? "text-purple-400" : "text-surface-500")} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-medium line-clamp-2 leading-snug",
                              isActive ? "text-primary-400" : "text-surface-300"
                            )}>
                              {lesson.title}
                            </p>
                            {lesson.duration && (
                              <span className="text-[10px] text-surface-500 mt-1 block">
                                {Math.floor(lesson.duration / 60)} دقيقة
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
