import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Layers, Save, ArrowRight, Plus, Video,
  FileText, ChevronDown, ChevronRight, Trash2, AlertCircle, CheckCircle2, UploadCloud, Loader2, Edit2
} from 'lucide-react';
import { adminCoursesApi } from '../../features/courses/api/admin.courses';
import QuizBuilder from '../../features/quiz/components/QuizBuilder';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

// ------------------------------------------------------------------
// Curriculum sub-components
// ------------------------------------------------------------------

function AddItemForm({ placeholder, onAdd, onCancel }: { placeholder: string; onAdd: (title: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-2 mt-2">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { onAdd(value.trim()); } if (e.key === 'Escape') onCancel(); }}
        placeholder={placeholder}
        className="flex-1 bg-surface-950 border border-primary-500/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
      />
      <button
        onClick={() => { if (value.trim()) onAdd(value.trim()); }}
        disabled={!value.trim()}
        className="px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm disabled:opacity-50 transition-all"
      >
        إضافة
      </button>
      <button onClick={onCancel} className="px-3 py-2 bg-surface-800 hover:bg-surface-700 text-surface-400 rounded-lg text-sm transition-all">
        إلغاء
      </button>
    </div>
  );
}

function LessonRow({ lesson, courseId }: { lesson: any; courseId: string }) {
  const typeColor = lesson.type === 'VIDEO' ? 'text-primary-400' : lesson.type === 'QUIZ' ? 'text-amber-400' : 'text-purple-400';
  const TypeIcon = lesson.type === 'VIDEO' ? Video : FileText;
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleUploadClick = () => {
    if (lesson.type === 'VIDEO' || lesson.type === 'PDF') {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      // Upload to S3/R2
      const mediaType = lesson.type === 'VIDEO' ? 'video' : 'file';
      const uploadedData = await adminCoursesApi.uploadMedia(file, mediaType, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setUploadProgress(percentCompleted);
      });
      
      // Update Lesson in DB
      const updatePayload = lesson.type === 'VIDEO' 
        ? { videoKey: uploadedData.key } 
        : { pdfKey: uploadedData.key };
        
      await adminCoursesApi.updateLesson(lesson.id, updatePayload);
      
      // Refresh curriculum
      qc.invalidateQueries({ queryKey: ['course-admin', courseId] });
      toast.success('تم رفع الملف بنجاح!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('حدث خطأ أثناء الرفع.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = () => {
    toast((t) => (
      <div className="flex flex-col gap-3" dir="rtl">
        <p className="font-medium text-surface-900">هل أنت متأكد من حذف الملف المرفق؟</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-medium bg-surface-200 hover:bg-surface-300 text-surface-700 rounded-lg">إلغاء</button>
          <button onClick={async () => {
              toast.dismiss(t.id);
              try {
                const updatePayload = lesson.type === 'VIDEO' ? { videoKey: null } : { pdfKey: null };
                await adminCoursesApi.updateLesson(lesson.id, updatePayload);
                qc.invalidateQueries({ queryKey: ['course-admin', courseId] });
                toast.success('تم حذف الملف');
              } catch (e) {
                toast.error('حدث خطأ');
              }
          }} className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg">نعم، احذف</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const hasMedia = lesson.type === 'VIDEO' ? !!lesson.videoKey : !!lesson.pdfKey;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-800/30 rounded-xl transition-colors group">
      <TypeIcon className={cn('w-4 h-4 shrink-0', typeColor)} />
      <span className="flex-1 text-sm text-surface-300">{lesson.title}</span>
      {lesson.isFree && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold">مجاني</span>
      )}
      {lesson.duration && (
        <span className="text-xs text-surface-500">{Math.round(lesson.duration / 60)} د</span>
      )}
      
      {(lesson.type === 'VIDEO' || lesson.type === 'PDF') && (
        <div className="flex items-center gap-2">
          {hasMedia && !isUploading && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              مرفق
            </span>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept={lesson.type === 'VIDEO' ? 'video/mp4,video/webm' : 'application/pdf'} 
            onChange={handleFileChange}
          />

          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleUploadClick}
              disabled={isUploading}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden",
                isUploading ? "bg-surface-800 text-primary-400" :
                "bg-surface-800 text-surface-400 hover:text-white hover:bg-surface-700"
              )}
            >
              {isUploading && (
                <div className="absolute inset-y-0 right-0 bg-primary-500/20 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : hasMedia ? (
                  <Edit2 className="w-3.5 h-3.5" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                {isUploading ? `جاري الرفع ${uploadProgress}%` : hasMedia ? 'تغيير' : 'رفع ملف'}
              </span>
            </button>

            {hasMedia && !isUploading && (
              <button 
                onClick={handleDeleteMedia}
                className="p-1.5 ml-1 text-surface-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                title="حذف الملف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {lesson.type === 'QUIZ' && (
        <>
          <button 
            onClick={() => setShowQuizBuilder(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-lg text-xs font-medium transition-all opacity-0 group-hover:opacity-100"
          >
            <Settings className="w-3.5 h-3.5" />
            بناء الاختبار
          </button>
          
          {showQuizBuilder && (
            <QuizBuilder 
              lessonId={lesson.id} 
              onClose={() => setShowQuizBuilder(false)} 
            />
          )}
        </>
      )}
    </div>
  );
}

function ChapterBlock({ chapter, moduleId, courseId }: { chapter: any; moduleId: string; courseId: string }) {
  const [expanded, setExpanded] = useState(true);
  const [addingLesson, setAddingLesson] = useState(false);
  const [lessonType, setLessonType] = useState<'VIDEO' | 'QUIZ' | 'PDF'>('VIDEO');
  const qc = useQueryClient();

  const addLessonMutation = useMutation({
    mutationFn: (title: string) => adminCoursesApi.createLesson(chapter.id, { title, type: lessonType, isFree: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course-admin', courseId] }); setAddingLesson(false); },
  });

  return (
    <div className="border border-surface-800 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-3 bg-surface-800/30 cursor-pointer hover:bg-surface-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-surface-500" /> : <ChevronRight className="w-4 h-4 text-surface-500" />}
        <span className="flex-1 text-sm font-medium text-surface-200">{chapter.title}</span>
        <span className="text-xs text-surface-500">{chapter.lessons?.length || 0} دروس</span>
      </div>

      {expanded && (
        <div className="p-2 space-y-1">
          {chapter.lessons?.map((lesson: any) => (
            <LessonRow key={lesson.id} lesson={lesson} courseId={courseId} />
          ))}

          {addingLesson ? (
            <div className="px-2 py-2 space-y-2">
              <div className="flex gap-2">
                {(['VIDEO', 'QUIZ', 'PDF'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setLessonType(t)}
                    className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all border',
                      lessonType === t ? 'bg-primary-600/20 border-primary-500/50 text-primary-300' : 'bg-surface-800 border-surface-700 text-surface-400'
                    )}
                  >
                    {t === 'VIDEO' ? '🎬 فيديو' : t === 'QUIZ' ? '📝 اختبار' : '📄 PDF'}
                  </button>
                ))}
              </div>
              <AddItemForm
                placeholder="عنوان الدرس..."
                onAdd={title => addLessonMutation.mutate(title)}
                onCancel={() => setAddingLesson(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingLesson(true)}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-surface-500 hover:text-primary-400 hover:bg-primary-500/5 rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة درس
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ModuleBlock({ module, courseId }: { module: any; courseId: string }) {
  const [expanded, setExpanded] = useState(true);
  const [addingChapter, setAddingChapter] = useState(false);
  const qc = useQueryClient();

  const addChapterMutation = useMutation({
    mutationFn: (title: string) => adminCoursesApi.createChapter(module.id, { title }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course-admin', courseId] }); setAddingChapter(false); },
  });

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-4 bg-surface-800/40 cursor-pointer hover:bg-surface-800/60 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-primary-400" /> : <ChevronRight className="w-4 h-4 text-primary-400" />}
        <Layers className="w-4 h-4 text-primary-400" />
        <h4 className="flex-1 font-bold text-white">{module.title}</h4>
        <span className="text-xs text-surface-500 bg-surface-800 px-2 py-1 rounded-lg">
          {module.chapters?.reduce((acc: number, c: any) => acc + (c.lessons?.length || 0), 0) || 0} درس
        </span>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          {module.chapters?.map((chapter: any) => (
            <ChapterBlock key={chapter.id} chapter={chapter} moduleId={module.id} courseId={courseId} />
          ))}

          {addingChapter ? (
            <AddItemForm
              placeholder="اسم الفصل..."
              onAdd={title => addChapterMutation.mutate(title)}
              onCancel={() => setAddingChapter(false)}
            />
          ) : (
            <button
              onClick={() => setAddingChapter(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-surface-700 text-surface-500 hover:text-white hover:border-surface-500 text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              إضافة فصل (Chapter)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Main CourseEditor
// ------------------------------------------------------------------

export default function CourseEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'settings' | 'curriculum'>('settings');
  const [successMsg, setSuccessMsg] = useState('');
  const [addingModule, setAddingModule] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    isPublished: false,
    level: 'BEGINNER',
  });

  // Fetch full course data including ALL modules/chapters/lessons (admin endpoint — no isPublished filter)
  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course-admin', id],
    queryFn: () => adminCoursesApi.getAdminCourse(id!),
    enabled: !isNew,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (courseData) {
      setFormData({
        title: courseData.title || '',
        description: courseData.description || '',
        price: Number(courseData.price) || 0,
        isPublished: courseData.isPublished || false,
        level: courseData.level || 'BEGINNER',
      });
    }
  }, [courseData]);

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      isNew ? adminCoursesApi.createCourse(data) : adminCoursesApi.updateCourse(id!, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setSuccessMsg('تم الحفظ بنجاح!');
      setTimeout(() => setSuccessMsg(''), 3000);
      if (isNew && data?.id) {
        navigate(`/admin/courses/${data.id}/edit`, { replace: true });
        setTimeout(() => setActiveTab('curriculum'), 200);
      }
    },
  });

  const addModuleMutation = useMutation({
    mutationFn: (title: string) => adminCoursesApi.createModule(id!, { title }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['course-admin', id] }); setAddingModule(false); },
  });

  const handleSave = (e: React.FormEvent) => { e.preventDefault(); saveMutation.mutate(formData); };

  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/courses')}
            className="p-2 bg-surface-900 border border-surface-800 rounded-xl hover:bg-surface-800 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-surface-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {isNew ? 'إنشاء كورس جديد' : 'تعديل الكورس'}
            </h1>
            <p className="text-surface-400 text-sm">
              {isNew ? 'أدخل المعلومات الأساسية ثم أضف المحتوى' : courseData?.title || '...'}
            </p>
          </div>
        </div>
        {!isNew && (
          <span className={cn(
            'px-3 py-1 rounded-lg text-sm font-medium border',
            formData.isPublished
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          )}>
            {formData.isPublished ? '✅ منشور' : '📝 مسودة'}
          </span>
        )}
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Mutation Error */}
      {saveMutation.isError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          حدث خطأ أثناء الحفظ. تأكد من ملء جميع الحقول المطلوبة.
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-surface-800 gap-8">
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'pb-4 flex items-center gap-2 text-sm font-medium transition-colors relative',
            activeTab === 'settings' ? 'text-primary-400' : 'text-surface-400 hover:text-white'
          )}
        >
          <Settings className="w-4 h-4" />
          الإعدادات الأساسية
          {activeTab === 'settings' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('curriculum')}
          disabled={isNew}
          title={isNew ? 'احفظ الكورس أولاً ثم أضف المحتوى' : ''}
          className={cn(
            'pb-4 flex items-center gap-2 text-sm font-medium transition-colors relative',
            activeTab === 'curriculum' ? 'text-primary-400' : 'text-surface-400 hover:text-white',
            isNew && 'opacity-40 cursor-not-allowed'
          )}
        >
          <Layers className="w-4 h-4" />
          المنهج والمحتوى
          {!isNew && (
            <span className="text-xs bg-surface-800 px-1.5 py-0.5 rounded-md text-surface-500">
              {courseData?.modules?.length || 0}
            </span>
          )}
          {activeTab === 'curriculum' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full" />}
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'settings' ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  عنوان الكورس <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-white placeholder:text-surface-600 focus:border-primary-500 focus:outline-none transition-all"
                  placeholder="مثال: Python للمبتدئين — من الصفر للاحتراف"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  وصف الكورس <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-white placeholder:text-surface-600 focus:border-primary-500 focus:outline-none transition-all resize-none"
                  placeholder="اشرح ما سيتعلمه الطالب، والمتطلبات المسبقة، والنتائج المتوقعة..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">المستوى</label>
                  <select
                    value={formData.level}
                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                    className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-white focus:border-primary-500 focus:outline-none transition-all"
                  >
                    <option value="BEGINNER">مبتدئ</option>
                    <option value="INTERMEDIATE">متوسط</option>
                    <option value="ADVANCED">متقدم</option>
                    <option value="ALL_LEVELS">جميع المستويات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    السعر <span className="text-surface-500 font-normal">(0 = مجاني)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-white focus:border-primary-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {!isNew && (
                <div className="flex items-center gap-3 pt-4 border-t border-surface-800">
                  <div
                    onClick={() => setFormData(f => ({ ...f, isPublished: !f.isPublished }))}
                    className={cn(
                      'relative w-12 h-6 rounded-full cursor-pointer transition-colors',
                      formData.isPublished ? 'bg-primary-600' : 'bg-surface-700'
                    )}
                  >
                    <div className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
                      formData.isPublished ? 'right-1' : 'left-1'
                    )} />
                  </div>
                  <label className="text-sm font-medium text-surface-300 cursor-pointer" onClick={() => setFormData(f => ({ ...f, isPublished: !f.isPublished }))}>
                    {formData.isPublished ? 'الكورس منشور — مرئي للطلاب' : 'الكورس مسودة — غير مرئي للطلاب'}
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-primary-500/20"
              >
                <Save className="w-5 h-5" />
                {saveMutation.isPending ? 'جاري الحفظ...' : isNew ? 'حفظ وإضافة المحتوى' : 'حفظ التغييرات'}
              </button>
            </div>
          </form>
        ) : (
          /* Curriculum Tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-surface-400 text-sm">
                قم بتنظيم الكورس إلى وحدات، فصول، ودروس.
              </p>
              <button
                onClick={() => setAddingModule(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                وحدة جديدة
              </button>
            </div>

            {/* Add module inline form */}
            {addingModule && (
              <div className="glass rounded-2xl p-4 border border-primary-500/20">
                <p className="text-sm text-surface-400 mb-2">اسم الوحدة الجديدة:</p>
                <AddItemForm
                  placeholder="مثال: الوحدة الأولى — مقدمة في Python"
                  onAdd={title => addModuleMutation.mutate(title)}
                  onCancel={() => setAddingModule(false)}
                />
              </div>
            )}

            {/* Modules list */}
            {courseLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-20 bg-surface-900 rounded-2xl animate-pulse" />)}
              </div>
            ) : courseData?.modules?.length === 0 || !courseData?.modules ? (
              <div className="glass rounded-2xl p-12 border border-white/5 text-center">
                <Layers className="w-14 h-14 text-surface-700 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">لا يوجد محتوى بعد</h3>
                <p className="text-surface-500 text-sm mb-6">ابدأ بإضافة وحدة أولى، ثم أضف إليها فصولاً ودروساً</p>
                <button
                  onClick={() => setAddingModule(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all font-medium"
                >
                  <Plus className="w-5 h-5" />
                  إضافة الوحدة الأولى
                </button>
              </div>
            ) : (
              courseData.modules.map((module: any) => (
                <ModuleBlock key={module.id} module={module} courseId={id!} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
