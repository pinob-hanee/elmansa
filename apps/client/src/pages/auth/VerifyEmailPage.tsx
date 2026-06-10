import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const { isLoading, isSuccess, isError } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => api.get(`/auth/verify-email?token=${token}`),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (isSuccess) setTimeout(() => navigate('/login'), 3000);
  }, [isSuccess]);

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6" dir="rtl">
      <div className="glass rounded-3xl p-10 border border-surface-200 max-w-md text-center">
        {isLoading && (
          <>
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-surface-300">جاري التحقق من بريدك الإلكتروني...</p>
          </>
        )}
        {isSuccess && (
          <>
            <div className="text-5xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-surface-50 mb-3">تم التحقق بنجاح!</h2>
            <p className="text-surface-400">سيتم تحويلك لصفحة تسجيل الدخول...</p>
          </>
        )}
        {isError && (
          <>
            <div className="text-5xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-surface-50 mb-3">رابط غير صالح</h2>
            <p className="text-surface-400 mb-6">هذا الرابط منتهي الصلاحية أو تم استخدامه من قبل.</p>
            <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-all">
              العودة لتسجيل الدخول
            </button>
          </>
        )}
      </div>
    </div>
  );
}
