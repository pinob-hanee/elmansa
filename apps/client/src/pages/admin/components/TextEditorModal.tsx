import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { X, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCoursesApi } from '../../../features/courses/api/admin.courses';
import toast from 'react-hot-toast';

interface TextEditorModalProps {
  lessonId: string;
  courseId: string;
  initialContent: string;
  onClose: () => void;
}

export default function TextEditorModal({ lessonId, courseId, initialContent, onClose }: TextEditorModalProps) {
  const [content, setContent] = useState(initialContent || '');
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (newContent: string) => adminCoursesApi.updateLesson(lessonId, { content: newContent }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-admin', courseId] });
      toast.success('تم حفظ المحتوى بنجاح');
      onClose();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  });

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image', 'video'],
      ['clean'],
      [{ 'direction': 'rtl' }]
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-surface-900 border border-surface-800 rounded-2xl shadow-2xl flex flex-col h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800">
          <h2 className="text-xl font-bold text-surface-50">تعديل محتوى المقال</h2>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-50 hover:bg-surface-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden p-6 relative quill-wrapper" dir="rtl">
          <style>{`
            .quill-wrapper .ql-container {
              font-family: 'Inter', 'Tajawal', sans-serif;
              font-size: 16px;
              border-color: #2a2a35 !important;
              background-color: rgba(255, 255, 255, 0.02);
              border-bottom-left-radius: 8px;
              border-bottom-right-radius: 8px;
              height: calc(100% - 42px);
              overflow-y: auto;
            }
            .quill-wrapper .ql-toolbar {
              border-color: #2a2a35 !important;
              background-color: rgba(255, 255, 255, 0.05);
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
            }
            .quill-wrapper .ql-editor {
              color: #f8fafc;
              min-height: 300px;
            }
            .quill-wrapper .ql-stroke {
              stroke: #cbd5e1;
            }
            .quill-wrapper .ql-fill {
              fill: #cbd5e1;
            }
            .quill-wrapper .ql-picker {
              color: #cbd5e1;
            }
          `}</style>
          <ReactQuill 
            theme="snow" 
            value={content} 
            onChange={setContent} 
            modules={modules}
            className="h-full"
            placeholder="اكتب محتوى الدرس هنا..."
          />
        </div>

        <div className="px-6 py-4 border-t border-surface-800 flex justify-end gap-3 bg-surface-900/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 font-medium text-surface-300 hover:text-surface-50 bg-surface-800 hover:bg-surface-700 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button 
            onClick={() => updateMutation.mutate(content)}
            disabled={updateMutation.isPending}
            className="px-6 py-2 font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-xl transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  );
}
