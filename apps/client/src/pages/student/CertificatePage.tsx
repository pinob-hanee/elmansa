import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, Star, Calendar, Shield } from 'lucide-react';
import api from '../../lib/api';

export default function CertificatePage() {
  const { code } = useParams();

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ['certificate', code],
    queryFn: () => api.get(`/gamification/certificate/${code}`).then(r => r.data.data),
    retry: false,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (isError || !cert) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center text-white text-center">
      <div>
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-2">الشهادة غير موجودة</h1>
        <p className="text-surface-400">تأكد من صحة الرابط</p>
      </div>
    </div>
  );

  const studentName = `${cert.user?.profile?.firstName || ''} ${cert.user?.profile?.lastName || ''}`.trim();
  const issueDate = new Date(cert.issueDate).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 flex items-center justify-center p-6" dir="rtl">
      {/* Certificate Card */}
      <div className="w-full max-w-3xl">
        {/* Outer border */}
        <div className="relative bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 p-1 rounded-3xl shadow-2xl shadow-amber-500/20">
          {/* Inner card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl overflow-hidden">
            {/* Top decoration */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 p-8 text-center border-b border-amber-500/20">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
                  <Award className="w-10 h-10 text-white" />
                </div>
              </div>
              <p className="text-amber-400 font-semibold tracking-widest uppercase text-sm mb-1">منصة المنسى التعليمية</p>
              <h1 className="text-3xl font-bold text-white">شهادة إتمام</h1>
            </div>

            {/* Body */}
            <div className="p-10 text-center">
              <p className="text-surface-400 text-lg mb-3">يُشهد بأن</p>
              <h2 className="text-4xl font-extrabold text-white mb-6 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                {studentName || 'الطالب'}
              </h2>
              <p className="text-surface-300 text-lg mb-2">قد أتمّ بنجاح كورس</p>
              <div className="inline-block bg-gradient-to-r from-primary-900/50 to-purple-900/50 border border-primary-500/30 rounded-2xl px-8 py-4 mb-8">
                <h3 className="text-2xl font-bold text-primary-300">{cert.course?.title}</h3>
              </div>

              <div className="flex justify-center gap-8 mb-8">
                <div className="flex items-center gap-2 text-surface-400">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <span className="text-sm">{issueDate}</span>
                </div>
                <div className="flex items-center gap-2 text-surface-400">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-mono text-xs">{cert.uniqueCode}</span>
                </div>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
                ))}
              </div>
            </div>

            {/* Bottom */}
            <div className="bg-gradient-to-r from-purple-900/50 via-slate-900 to-purple-900/50 border-t border-amber-500/10 p-6 text-center">
              <p className="text-surface-500 text-sm">
                يمكن التحقق من صحة هذه الشهادة عبر الرابط:
                <span className="text-primary-400 font-mono text-xs mr-2 block mt-1">
                  {window.location.href}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Print / Share */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-medium transition-all border border-surface-700"
          >
            🖨️ طباعة الشهادة
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('تم نسخ الرابط!'))}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-all"
          >
            🔗 مشاركة الشهادة
          </button>
        </div>
      </div>
    </div>
  );
}
