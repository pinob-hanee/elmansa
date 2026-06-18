import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { cn } from '../../lib/utils';

function makeSchema(t: any) {
  return z.object({ email: z.string().email(t('auth.emailInvalid')) });
}
type FormData = { email: string };

export default function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(makeSchema(t)) });
  const mutation = useMutation({ mutationFn: (d: FormData) => api.post('/auth/forgot-password', d) });

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 border border-surface-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-600/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-surface-50 mb-2">
              {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
            </h1>
            <p className="text-surface-400 text-sm">
              {isRtl ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين' : 'Enter your email and we will send you a reset link'}
            </p>
          </div>
          {mutation.isSuccess ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📩</div>
              <p className="text-surface-300">
                {isRtl ? 'تم إرسال رابط إعادة التعيين! تحقق من بريدك الإلكتروني.' : 'Reset link sent! Check your email.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500', isRtl ? 'right-3' : 'left-3')} />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className={cn('w-full py-3 rounded-xl bg-surface-800 border text-surface-50 placeholder-surface-500 outline-none transition-all', isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4', errors.email ? 'border-error/50' : 'border-surface-700 focus:border-primary-500')}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 hover:shadow-xl transition-all disabled:opacity-60"
              >
                {mutation.isPending
                  ? (isRtl ? 'جاري الإرسال...' : 'Sending...')
                  : (isRtl ? 'إرسال رابط الاستعادة' : 'Send Reset Link')}
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-surface-400">
            <Link to="/login" className="text-primary-400 hover:text-primary-300">
              {isRtl ? 'العودة لتسجيل الدخول' : 'Back to Login'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
