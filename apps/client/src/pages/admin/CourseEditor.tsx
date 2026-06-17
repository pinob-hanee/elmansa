import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Layers, Save, ArrowRight, Plus, Video,
  FileText, ChevronDown, ChevronRight, Trash2, AlertCircle, CheckCircle2, UploadCloud, Loader2, Edit2, Calendar
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminCoursesApi } from '../../features/courses/api/admin.courses';
import QuizBuilder from '../../features/quiz/components/QuizBuilder';
import AssignmentBuilder from '../../features/courses/components/AssignmentBuilder';
import TextEditorModal from './components/TextEditorModal';
import ChapterDeadlineModal from './components/ChapterDeadlineModal';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

// ------------------------------------------------------------------
// Curriculum sub-components
// ------------------------------------------------------------------

function AddItemForm({ placeholder, onAdd, onCancel, addLabel, cancelLabel }: {
  placeholder: string;
  onAdd: (title: string) => void;
  onCancel: () => void;
  addLabel: string;
  cancelLabel: string;
}) {
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-2 mt-2">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) { onAdd(value.trim()); }
          if (e.key === 'Escape') onCancel();
        }}
        placeholder={placeholder}
        className="flex-1 bg-surface-950 border border-primary-500/50 rounded-lg px-3 py-2 text-surface-50 text-sm focus:outline-none"
      />
      <button
        onClick={() => { if (value.trim()) onAdd(value.trim()); }}
        disabled={!value.trim()}
        className="px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm disabled:opacity-50 transition-all"
      >
        {addLabel}
      </button>
      <button onClick={onCancel} className="px-3 py-2 bg-surface-800 hover:bg-surface-700 text-surface-400 rounded-lg text-sm transition-all">
        {cancelLabel}
      </button>
    </div>
  );
}

function LessonRow({ lesson, courseId }: { lesson: any; courseId: string }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const typeColor = lesson.type === 'VIDEO' ? 'text-primary-400' : lesson.type === 'QUIZ' ? 'text-amber-400' : lesson.type === 'TEXT' ? 'text-blue-400' : lesson.type === 'ASSIGNMENT' ? 'text-indigo-400' : 'text-surface-50';
  const TypeIcon = lesson.type === 'VIDEO' ? Video : lesson.type === 'TEXT' ? Edit2 : FileText;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [showAssignmentBuilder, setShowAssignmentBuilder] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const deleteLessonMutation = useMutation({
    mutationFn: () => adminCoursesApi.deleteLesson(lesson.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-admin', courseId] });
      toast.success(isRtl ? 'تم حذف الدرس' : 'Lesson deleted');
    },
    onError: () => toast.error(isRtl ? 'فشل حذف الدرس' : 'Failed to delete lesson'),
  });

  const handleDeleteLesson = () => {
    toast((toastObj) => (
      <div className="flex flex-col gap-4 p-1" dir={isRtl ? 'rtl' : 'ltr'}>
        <p className="font-semibold text-surface-900 text-sm">
          {isRtl ? `هل تريد حذف درس "${lesson.title}"؟` : `Delete lesson "${lesson.title}"?`}
        </p>
        <div className="flex gap-3 justify-end mt-1">
          <button
            onClick={() => toast.dismiss(toastObj.id)}
            className="px-4 py-2 text-xs font-bold bg-surface-100 hover:bg-surface-200 text-surface-600 rounded-xl transition-colors border border-surface-200"
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={() => { toast.dismiss(toastObj.id); deleteLessonMutation.mutate(); }}
            className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-sm shadow-red-500/20"
          >
            {isRtl ? 'نعم، احذف' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const mediaType = lesson.type === 'VIDEO' ? 'video' : 'file';
      const uploadedData = await adminCoursesApi.uploadMedia(file, mediaType, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setUploadProgress(percentCompleted);
      });
      const updatePayload = lesson.type === 'VIDEO'
        ? { videoKey: uploadedData.key }
        : { pdfKey: uploadedData.key };
      await adminCoursesApi.updateLesson(lesson.id, updatePayload);
      qc.invalidateQueries({ queryKey: ['course-admin', courseId] });
      toast.success(isRtl ? 'تم رفع الملف بنجاح!' : 'File uploaded successfully!');
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء الرفع.' : 'Upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = () => {
    toast((toastObj) => (
      <div className="flex flex-col gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
        <p className="font-medium text-surface-900">{t('courseEditor.deleteFileConfirm')}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(toastObj.id)} className="px-3 py-1.5 text-xs font-medium bg-surface-200 hover:bg-surface-300 text-surface-700 rounded-lg">
            {t('courseEditor.cancel')}
          </button>
          <button onClick={async () => {
            toast.dismiss(toastObj.id);
            try {
              const updatePayload = lesson.type === 'VIDEO' ? { videoKey: null } : { pdfKey: null };
              await adminCoursesApi.updateLesson(lesson.id, updatePayload);
              qc.invalidateQueries({ queryKey: ['course-admin', courseId] });
              toast.success(isRtl ? 'تم حذف الملف' : 'File deleted');
            } catch {
              toast.error(t('common.error'));
            }
          }} className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg">
            {t('courseEditor.deleteFileYes')}
          </button>
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
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold">
          {t('courseEditor.free')}
        </span>
      )}
      {lesson.duration && (
        <span className="text-xs text-surface-500">{Math.round(lesson.duration / 60)} {isRtl ? 'د' : 'min'}</span>
      )}

      {(lesson.type === 'VIDEO' || lesson.type === 'PDF') && (
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={lesson.type === 'VIDEO' ? 'video/mp4,video/webm' : 'application/pdf'}
            onChange={handleFileChange}
          />

          <div className={cn("flex items-center gap-2 transition-opacity", (hasMedia || isUploading) ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
            {isUploading ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-800 text-primary-400 relative overflow-hidden">
                <div className="absolute inset-y-0 right-0 bg-primary-500/20 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                <span className="relative z-10 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {uploadProgress === 100 ? (isRtl ? 'جاري المعالجة...' : 'Processing...') : t('courseEditor.uploading', { percent: uploadProgress })}
                </span>
              </div>
            ) : hasMedia ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('courseEditor.attached')}
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-800 text-surface-300 hover:text-surface-50 hover:bg-surface-700 transition-colors"
                >
                  {isRtl ? 'تغيير' : 'Change'}
                </button>
                <button
                  onClick={handleDeleteMedia}
                  className="p-1.5 text-surface-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                  title={t('courseEditor.deleteFile')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden bg-surface-800 text-surface-400 hover:text-surface-50 hover:bg-surface-700"
              >
                <UploadCloud className="w-3.5 h-3.5" />{t('courseEditor.upload')}
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
            {t('courseEditor.buildQuiz')}
          </button>
          {showQuizBuilder && (
            <QuizBuilder lessonId={lesson.id} onClose={() => setShowQuizBuilder(false)} />
          )}
        </>
      )}

      {lesson.type === 'ASSIGNMENT' && (
        <>
          <button
            onClick={() => setShowAssignmentBuilder(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs font-medium transition-all opacity-0 group-hover:opacity-100"
          >
            <Settings className="w-3.5 h-3.5" />
            {t('courseEditor.buildAssignment', 'Build Assignment')}
          </button>
          {showAssignmentBuilder && (
            <AssignmentBuilder lessonId={lesson.id} onClose={() => setShowAssignmentBuilder(false)} />
          )}
        </>
      )}

      {lesson.type === 'TEXT' && (
        <>
          <button
            onClick={() => setShowTextEditor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-all opacity-0 group-hover:opacity-100"
          >
            <Edit2 className="w-3.5 h-3.5" />
            {t('courseEditor.editArticle')}
          </button>
          {showTextEditor && (
            <TextEditorModal
              lessonId={lesson.id}
              courseId={courseId}
              initialContent={lesson.content}
              onClose={() => setShowTextEditor(false)}
            />
          )}
        </>
      )}

      {/* Delete lesson button - always visible on hover */}
      <button
        onClick={handleDeleteLesson}
        disabled={deleteLessonMutation.isPending}
        className="p-1.5 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
        title={isRtl ? 'حذف الدرس' : 'Delete lesson'}
      >
        {deleteLessonMutation.isPending
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Trash2 className="w-3.5 h-3.5" />
        }
      </button>
    </div>
  );
}

function ChapterBlock({ chapter, moduleId, courseId, allModules }: { chapter: any; moduleId: string; courseId: string; allModules: any[] }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [expanded, setExpanded] = useState(true);
  const [addingLesson, setAddingLesson] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [lessonType, setLessonType] = useState<'VIDEO' | 'QUIZ' | 'PDF' | 'TEXT' | 'ASSIGNMENT'>('VIDEO');
  const qc = useQueryClient();

  const deleteChapterMutation = useMutation({
    mutationFn: () => adminCoursesApi.deleteChapter(chapter.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-admin', courseId] });
      toast.success(isRtl ? 'تم حذف الفصل' : 'Chapter deleted');
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ أثناء الحذف' : 'Error deleting chapter'),
  });

  const moveChapterMutation = useMutation({
    mutationFn: (targetModuleId: string) => adminCoursesApi.moveChapter(chapter.id, targetModuleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-admin', courseId] });
      toast.success(isRtl ? 'تم النقل بنجاح' : 'Moved successfully');
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ أثناء النقل' : 'Error moving chapter'),
  });

  const addLessonMutation = useMutation({
    mutationFn: (title: string) => adminCoursesApi.createLesson(chapter.id, { title, type: lessonType, isFree: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course-admin', courseId] }); setAddingLesson(false); },
  });

  const lessonTypeLabels: Record<string, string> = {
    VIDEO: t('courseEditor.typeVideo'),
    QUIZ: t('courseEditor.typeQuiz'),
    PDF: t('courseEditor.typePdf'),
    TEXT: t('courseEditor.typeText', 'Text / Article'),
    ASSIGNMENT: t('courseEditor.typeAssignment', 'Project / Assignment'),
  };

  return (
    <div className="border border-surface-800 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-3 bg-surface-800/30 cursor-pointer hover:bg-surface-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-surface-500" /> : <ChevronRight className="w-4 h-4 text-surface-500" />}
        <span className="flex-1 text-sm font-medium text-surface-200">{chapter.title}</span>
        <span className="text-xs text-surface-500 mr-2">{chapter.lessons?.length || 0} {t('courseEditor.lessons')}</span>
        <button
          onClick={(e) => { e.stopPropagation(); setShowDeadlineModal(true); }}
          className="p-1.5 bg-surface-700/50 hover:bg-surface-600 rounded-lg text-surface-400 hover:text-surface-50 transition-colors"
          title="Manage Deadline"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Move Chapter Dropdown (Inline Select) */}
        {allModules?.length > 1 && (
          <select
            className="text-xs bg-surface-700 text-surface-300 border-none rounded-md px-2 py-1 outline-none"
            onClick={(e) => e.stopPropagation()}
            value={moduleId}
            onChange={(e) => moveChapterMutation.mutate(e.target.value)}
            disabled={moveChapterMutation.isPending}
            title={isRtl ? 'نقل الفصل إلى وحدة أخرى' : 'Move chapter to another module'}
          >
            {allModules.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا الفصل؟ سيتم حذف جميع الدروس بداخله.' : 'Are you sure you want to delete this chapter? All lessons inside will be deleted.')) {
              deleteChapterMutation.mutate();
            }
          }}
          disabled={deleteChapterMutation.isPending}
          className="p-1.5 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          title={isRtl ? 'حذف الفصل' : 'Delete chapter'}
        >
          {deleteChapterMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {showDeadlineModal && (
        <ChapterDeadlineModal
          chapterId={chapter.id}
          courseId={courseId}
          currentDeadline={chapter.deadline}
          onClose={() => setShowDeadlineModal(false)}
        />
      )}

      {expanded && (
        <div className="p-2 space-y-1">
          {chapter.lessons?.map((lesson: any) => (
            <LessonRow key={lesson.id} lesson={lesson} courseId={courseId} />
          ))}

          {addingLesson ? (
            <div className="px-2 py-2 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {(['VIDEO', 'QUIZ', 'PDF', 'TEXT', 'ASSIGNMENT'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setLessonType(type)}
                    className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all border',
                      lessonType === type ? 'bg-primary-600/20 border-primary-500/50 text-primary-300' : 'bg-surface-800 border-surface-700 text-surface-400'
                    )}
                  >
                    {lessonTypeLabels[type]}
                  </button>
                ))}
              </div>
              <AddItemForm
                placeholder={t('courseEditor.lessonNamePlaceholder')}
                onAdd={title => addLessonMutation.mutate(title)}
                onCancel={() => setAddingLesson(false)}
                addLabel={t('courseEditor.add')}
                cancelLabel={t('courseEditor.cancel')}
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingLesson(true)}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-surface-500 hover:text-primary-400 hover:bg-primary-500/5 rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('courseEditor.addLesson')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ModuleBlock({ module, courseId, allModules }: { module: any; courseId: string; allModules: any[] }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [addingChapter, setAddingChapter] = useState(false);
  const qc = useQueryClient();

  const addChapterMutation = useMutation({
    mutationFn: (title: string) => adminCoursesApi.createChapter(module.id, { title }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course-admin', courseId] }); setAddingChapter(false); },
  });

  return (
    <div className="glass rounded-2xl border border-surface-200 overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-4 bg-surface-800/40 cursor-pointer hover:bg-surface-800/60 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-primary-400" /> : <ChevronRight className="w-4 h-4 text-primary-400" />}
        <Layers className="w-4 h-4 text-primary-400" />
        <h4 className="flex-1 font-bold text-surface-50">{module.title}</h4>
        <span className="text-xs text-surface-500 bg-surface-800 px-2 py-1 rounded-lg">
          {module.chapters?.reduce((acc: number, c: any) => acc + (c.lessons?.length || 0), 0) || 0} {t('courseEditor.lessons')}
        </span>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          {module.chapters?.map((chapter: any) => (
            <ChapterBlock key={chapter.id} chapter={chapter} moduleId={module.id} courseId={courseId} allModules={allModules} />
          ))}

          {addingChapter ? (
            <AddItemForm
              placeholder={t('courseEditor.chapterNamePlaceholder')}
              onAdd={title => addChapterMutation.mutate(title)}
              onCancel={() => setAddingChapter(false)}
              addLabel={t('courseEditor.add')}
              cancelLabel={t('courseEditor.cancel')}
            />
          ) : (
            <button
              onClick={() => setAddingChapter(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-surface-700 text-surface-500 hover:text-surface-50 hover:border-surface-500 text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              {t('courseEditor.addChapter')}
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
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
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
      setSuccessMsg(t('courseEditor.savedSuccess'));
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

  const levelOptions = [
    { value: 'BEGINNER', label: t('courseEditor.beginner') },
    { value: 'INTERMEDIATE', label: t('courseEditor.intermediate') },
    { value: 'ADVANCED', label: t('courseEditor.advanced') },
    { value: 'ALL_LEVELS', label: t('courseEditor.allLevels') },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/courses')}
            className="p-2 bg-surface-900 border border-surface-800 rounded-xl hover:bg-surface-800 transition-colors"
          >
            <ArrowRight className={cn('w-5 h-5 text-surface-400', !isRtl && 'rotate-180')} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-surface-50 mb-1">
              {isNew ? t('courseEditor.createTitle') : t('courseEditor.editTitle')}
            </h1>
            <p className="text-surface-400 text-sm">
              {isNew ? t('courseEditor.createSubtitle') : (courseData?.title || '...')}
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
            {formData.isPublished ? t('courseEditor.published') : t('courseEditor.draft')}
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
          {t('courseEditor.saveError')}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-surface-800 gap-8">
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'pb-4 flex items-center gap-2 text-sm font-medium transition-colors relative',
            activeTab === 'settings' ? 'text-primary-400' : 'text-surface-400 hover:text-surface-50'
          )}
        >
          <Settings className="w-4 h-4" />
          {t('courseEditor.tabSettings')}
          {activeTab === 'settings' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('curriculum')}
          disabled={isNew}
          title={isNew ? t('courseEditor.tabCurriculumDisabled') : ''}
          className={cn(
            'pb-4 flex items-center gap-2 text-sm font-medium transition-colors relative',
            activeTab === 'curriculum' ? 'text-primary-400' : 'text-surface-400 hover:text-surface-50',
            isNew && 'opacity-40 cursor-not-allowed'
          )}
        >
          <Layers className="w-4 h-4" />
          {t('courseEditor.tabCurriculum')}
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
            <div className="glass rounded-2xl p-6 border border-surface-200 space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  {t('courseEditor.courseTitle')} <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-surface-50 placeholder:text-surface-600 focus:border-primary-500 focus:outline-none transition-all"
                  placeholder={t('courseEditor.courseTitlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  {t('courseEditor.courseDescription')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-surface-50 placeholder:text-surface-600 focus:border-primary-500 focus:outline-none transition-all resize-none"
                  placeholder={t('courseEditor.courseDescriptionPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">{t('courseEditor.level')}</label>
                  <select
                    value={formData.level}
                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                    className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-surface-50 focus:border-primary-500 focus:outline-none transition-all"
                  >
                    {levelOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    {t('courseEditor.price')} <span className="text-surface-500 font-normal">{t('courseEditor.priceFreeHint')}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-surface-50 focus:border-primary-500 focus:outline-none transition-all"
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
                    {formData.isPublished ? t('courseEditor.publishedLabel') : t('courseEditor.draftLabel')}
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
                {saveMutation.isPending
                  ? t('courseEditor.saving')
                  : isNew ? t('courseEditor.saveAndAddContent') : t('courseEditor.saveChanges')}
              </button>
            </div>
          </form>
        ) : (
          /* Curriculum Tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-surface-400 text-sm">{t('courseEditor.curriculumHint')}</p>
              <button
                onClick={() => setAddingModule(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                {t('courseEditor.newModule')}
              </button>
            </div>

            {addingModule && (
              <div className="glass rounded-2xl p-4 border border-primary-500/20">
                <p className="text-sm text-surface-400 mb-2">{t('courseEditor.newModuleName')}</p>
                <AddItemForm
                  placeholder={t('courseEditor.moduleNamePlaceholder')}
                  onAdd={title => addModuleMutation.mutate(title)}
                  onCancel={() => setAddingModule(false)}
                  addLabel={t('courseEditor.add')}
                  cancelLabel={t('courseEditor.cancel')}
                />
              </div>
            )}

            {courseLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-20 bg-surface-900 rounded-2xl animate-pulse" />)}
              </div>
            ) : courseData?.modules?.length === 0 || !courseData?.modules ? (
              <div className="glass rounded-2xl p-12 border border-surface-200 text-center">
                <Layers className="w-14 h-14 text-surface-700 mx-auto mb-4" />
                <h3 className="text-surface-50 font-bold text-lg mb-2">{t('courseEditor.noContent')}</h3>
                <p className="text-surface-500 text-sm mb-6">{t('courseEditor.noContentHint')}</p>
                <button
                  onClick={() => setAddingModule(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all font-medium"
                >
                  <Plus className="w-5 h-5" />
                  {t('courseEditor.addFirstModule')}
                </button>
              </div>
            ) : (
              courseData.modules.map((module: any) => (
                <ModuleBlock key={module.id} module={module} courseId={courseData.id} allModules={courseData.modules} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
