import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Plus, Trash2, Eye, EyeOff, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { cn } from '../../lib/utils';

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface StarterCode {
  python: string;
  javascript: string;
  cpp: string;
  java: string;
  c: string;
}

const DEFAULT_STARTER: StarterCode = {
  python: '# Write your solution here\n',
  javascript: '// Write your solution here\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
  java: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
};

const LANGUAGES = ['python', 'javascript', 'cpp', 'java', 'c'];

interface Props {
  problem?: any;
  onClose: () => void;
}

export default function CodingProblemEditor({ problem, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [form, setForm] = useState({
    title: problem?.title || '',
    titleAr: problem?.titleAr || '',
    description: problem?.description || '',
    descriptionAr: problem?.descriptionAr || '',
    difficulty: problem?.difficulty || 'EASY',
    languages: problem?.languages || ['python', 'javascript'],
    tags: (problem?.tags || []).join(', '),
    timeLimit: problem?.timeLimit || 5,
    memoryLimit: problem?.memoryLimit || 256,
    isPublished: problem?.isPublished || false,
    starterCode: problem?.starterCode || DEFAULT_STARTER,
  });

  const [testCases, setTestCases] = useState<TestCase[]>(
    problem?.testCases || [{ input: '', expectedOutput: '', isHidden: false }]
  );
  const [activeTab, setActiveTab] = useState<'details' | 'testcases' | 'starter'>('details');

  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      problem?.id
        ? api.put(`/coding/admin/problems`, { problemId: problem.id, ...data }).then(r => r.data)
        : api.post('/coding/admin/problems', data).then(r => r.data),
    onSuccess: () => {
      toast.success(problem?.id ? 'تم تحديث المسألة بنجاح' : 'تم إنشاء المسألة');
      qc.invalidateQueries({ queryKey: ['admin-coding-problems'] });
      
      // Only close if it's a newly created problem
      if (!problem?.id) {
        onClose();
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'فشل حفظ المسألة'),
  });

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('عنوان المسألة مطلوب'); return; }
    if (!form.description.trim()) { toast.error('وصف المسألة مطلوب'); return; }
    if (testCases.length === 0) { toast.error('يجب إضافة حالة اختبار واحدة على الأقل'); return; }

    const payload = {
      ...form,
      tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      testCases,
    };
    saveMutation.mutate(payload);
  };

  const addTestCase = () => setTestCases(prev => [...prev, { input: '', expectedOutput: '', isHidden: false }]);
  const removeTestCase = (i: number) => setTestCases(prev => prev.filter((_, idx) => idx !== i));
  const updateTestCase = (i: number, key: keyof TestCase, value: any) => {
    setTestCases(prev => prev.map((tc, idx) => idx === i ? { ...tc, [key]: value } : tc));
  };

  const toggleLanguage = (lang: string) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l: string) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-50 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          {t('adminCoding.backToList', 'العودة للقائمة')}
        </button>
        <h1 className="text-xl font-bold text-surface-50">
          {problem?.id ? t('adminCoding.editProblem', 'تعديل المسألة') : t('adminCoding.newProblem', 'مسألة جديدة')}
        </h1>
        <div className="flex-1" />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={e => setForm(prev => ({ ...prev, isPublished: e.target.checked }))}
            className="w-4 h-4 rounded"
          />
          <span className="text-surface-300">{t('adminCoding.publish', 'نشر')}</span>
        </label>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('adminCoding.save', 'حفظ')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-800">
        {(['details', 'testcases', 'starter'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab ? 'border-primary-500 text-primary-400' : 'border-transparent text-surface-400 hover:text-surface-50'
            )}
          >
            {tab === 'details' ? t('adminCoding.details', 'التفاصيل') : tab === 'testcases' ? t('adminCoding.testCases', 'حالات الاختبار') : t('adminCoding.starterCode', 'الكود الابتدائي')}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">{t('adminCoding.titleEn', 'العنوان (إنجليزي)')} *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-2.5 text-surface-50 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
                placeholder="Two Sum"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">{t('adminCoding.titleAr', 'العنوان (عربي)')}</label>
              <input
                type="text"
                value={form.titleAr}
                onChange={e => setForm(prev => ({ ...prev, titleAr: e.target.value }))}
                className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-2.5 text-surface-50 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
                dir="rtl"
                placeholder="مجموع عنصرين"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-300">{t('adminCoding.descriptionEn', 'الوصف (إنجليزي - Markdown)')} *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={8}
              className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-3 text-surface-50 text-sm focus:outline-none focus:border-primary-500/50 transition-all resize-none font-mono"
              placeholder="Given an array of integers `nums` and an integer `target`..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-300">{t('adminCoding.descriptionAr', 'الوصف (عربي - Markdown)')}</label>
            <textarea
              value={form.descriptionAr}
              onChange={e => setForm(prev => ({ ...prev, descriptionAr: e.target.value }))}
              rows={8}
              dir="rtl"
              className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-3 text-surface-50 text-sm focus:outline-none focus:border-primary-500/50 transition-all resize-none font-mono"
              placeholder="بالنظر إلى مصفوفة من الأعداد الصحيحة..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">{t('adminCoding.difficulty', 'الصعوبة')}</label>
              <select
                value={form.difficulty}
                onChange={e => setForm(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-2.5 text-surface-50 text-sm focus:outline-none focus:border-primary-500/50"
              >
                <option value="EASY">سهل</option>
                <option value="MEDIUM">متوسط</option>
                <option value="HARD">صعب</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">{t('adminCoding.timeLimit', 'الحد الزمني (ثانية)')}</label>
              <input
                type="number"
                min={1}
                max={30}
                value={form.timeLimit}
                onChange={e => setForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-2.5 text-surface-50 text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">{t('adminCoding.memoryLimit', 'الذاكرة (MB)')}</label>
              <input
                type="number"
                min={64}
                max={512}
                value={form.memoryLimit}
                onChange={e => setForm(prev => ({ ...prev, memoryLimit: parseInt(e.target.value) }))}
                className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-2.5 text-surface-50 text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">{t('adminCoding.tags', 'الوسوم (مفصولة بفاصلة)')}</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="array, hashmap, dp"
                className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-2.5 text-surface-50 text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-300">{t('adminCoding.languages', 'لغات البرمجة المتاحة')}</label>
            <div className="flex gap-2 flex-wrap">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition-all',
                    form.languages.includes(lang)
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Test Cases Tab */}
      {activeTab === 'testcases' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-surface-400 text-sm">{t('adminCoding.testCasesDesc', 'أضف حالات الاختبار. الحالات المخفية لن تُعرض للطلاب.')}</p>
            <button
              onClick={addTestCase}
              className="flex items-center gap-2 px-3 py-2 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('adminCoding.addTestCase', 'إضافة حالة')}
            </button>
          </div>

          <div className="space-y-4">
            {testCases.map((tc, i) => (
              <div key={i} className="glass rounded-2xl border border-surface-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-surface-300">{t('adminCoding.testCase', 'حالة')} {i + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      {tc.isHidden ? <EyeOff className="w-4 h-4 text-surface-500" /> : <Eye className="w-4 h-4 text-surface-400" />}
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={e => updateTestCase(i, 'isHidden', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-surface-400">{t('adminCoding.hidden', 'مخفي')}</span>
                    </label>
                    {testCases.length > 1 && (
                      <button onClick={() => removeTestCase(i)} className="p-1.5 text-surface-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-surface-500">{t('adminCoding.input', 'المدخل')}</label>
                    <textarea
                      value={tc.input}
                      onChange={e => updateTestCase(i, 'input', e.target.value)}
                      rows={3}
                      className="w-full bg-surface-900 border border-surface-800 rounded-xl px-3 py-2 text-surface-50 text-xs font-mono focus:outline-none focus:border-primary-500/50 resize-none"
                      placeholder="1 2 3&#10;4"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-surface-500">{t('adminCoding.expectedOutput', 'المخرج المتوقع')}</label>
                    <textarea
                      value={tc.expectedOutput}
                      onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)}
                      rows={3}
                      className="w-full bg-surface-900 border border-surface-800 rounded-xl px-3 py-2 text-surface-50 text-xs font-mono focus:outline-none focus:border-primary-500/50 resize-none"
                      placeholder="6"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Starter Code Tab */}
      {activeTab === 'starter' && (
        <div className="space-y-4">
          <p className="text-surface-400 text-sm">{t('adminCoding.starterCodeDesc', 'حدد الكود الابتدائي لكل لغة. يمكن تركه فارغاً.')}</p>
          {form.languages.map((lang: string) => (
            <div key={lang} className="space-y-2">
              <label className="text-sm font-medium text-surface-300 font-mono">{lang}</label>
              <textarea
                value={(form.starterCode as any)[lang] || ''}
                onChange={e => setForm(prev => ({
                  ...prev,
                  starterCode: { ...prev.starterCode, [lang]: e.target.value }
                }))}
                rows={8}
                className="w-full bg-surface-900 border border-surface-800 rounded-xl px-4 py-3 text-surface-50 text-sm font-mono focus:outline-none focus:border-primary-500/50 resize-none"
                placeholder={`# ${lang} starter code`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
