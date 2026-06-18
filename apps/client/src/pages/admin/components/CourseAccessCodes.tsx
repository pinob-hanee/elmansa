import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCoursesApi } from '../../../features/courses/api/admin.courses';
import { Loader2, Plus, Key, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/utils';

export default function CourseAccessCodes({ courseId }: { courseId: string }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: codes, isLoading } = useQuery({
    queryKey: ['course-access-codes', courseId],
    queryFn: () => adminCoursesApi.getAccessCodes(courseId),
  });

  const generateMutation = useMutation({
    mutationFn: (userEmail: string) => adminCoursesApi.generateAccessCode(courseId, userEmail),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إنشاء كود التفعيل بنجاح' : 'Access code generated successfully');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['course-access-codes', courseId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (isRtl ? 'فشل في إنشاء الكود' : 'Failed to generate code'));
    }
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    generateMutation.mutate(email);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(isRtl ? 'تم نسخ الكود' : 'Code copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 border border-surface-200">
        <h3 className="text-lg font-bold text-surface-50 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary-500" />
          {isRtl ? 'إنشاء كود تفعيل جديد' : 'Generate New Access Code'}
        </h3>
        
        <form onSubmit={handleGenerate} className="flex gap-3">
          <input
            type="email"
            required
            placeholder={isRtl ? 'البريد الإلكتروني للطالب...' : 'Student email...'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-surface-900 border border-surface-800 rounded-xl p-3 text-surface-50 placeholder:text-surface-600 focus:border-primary-500 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={generateMutation.isPending || !email}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all font-medium disabled:opacity-50"
          >
            {generateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {isRtl ? 'إنشاء' : 'Generate'}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl border border-surface-200 overflow-hidden">
        <div className="p-4 border-b border-surface-800 bg-surface-800/50">
          <h3 className="font-bold text-surface-50">{isRtl ? 'أكواد التفعيل السابقة' : 'Previous Access Codes'}</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : codes?.length === 0 ? (
          <div className="p-8 text-center text-surface-500">
            {isRtl ? 'لا يوجد أكواد تفعيل بعد' : 'No access codes generated yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-surface-400">
              <thead className="bg-surface-800/30 text-surface-300">
                <tr>
                  <th className="p-4 font-medium">{isRtl ? 'الكود' : 'Code'}</th>
                  <th className="p-4 font-medium">{isRtl ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th className="p-4 font-medium">{isRtl ? 'تاريخ الإنشاء' : 'Created At'}</th>
                  <th className="p-4 font-medium">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="p-4 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/50">
                {codes?.map((code: any) => (
                  <tr key={code.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="p-4 font-mono text-primary-400 font-bold tracking-wider">
                      {code.code}
                    </td>
                    <td className="p-4 text-surface-200">{code.userEmail}</td>
                    <td className="p-4 text-surface-500">
                      {new Date(code.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {code.isUsed ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 text-rose-400 text-xs font-medium">
                          {isRtl ? 'مستخدم' : 'Used'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                          {isRtl ? 'نشط' : 'Active'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleCopy(code.code)}
                        className="p-2 text-surface-500 hover:text-white hover:bg-surface-700 rounded-lg transition-colors"
                        title={isRtl ? 'نسخ الكود' : 'Copy code'}
                      >
                        {copiedCode === code.code ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
