import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { cn } from '../../lib/utils';

const schema = z.object({ email: z.string().email('بريد إلكتروني غير صحيح') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const mutation = useMutation({ mutationFn: (d: FormData) => api.post('/auth/forgot-password', d) });

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-600/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-2">نسيت كلمة المرور؟</h1>
            <p className="text-surface-400 text-sm">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
          </div>
          {mutation.isSuccess ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📩</div>
              <p className="text-surface-300">تم إرسال رابط إعادة التعيين! تحقق من بريدك الإلكتروني.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className={cn('w-full pr-10 pl-4 py-3 rounded-xl bg-surface-800 border text-white placeholder-surface-500 outline-none transition-all', errors.email ? 'border-error/50' : 'border-surface-700 focus:border-primary-500')}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold hover:shadow-xl transition-all disabled:opacity-60"
              >
                {mutation.isPending ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-surface-400">
            <Link to="/login" className="text-primary-400 hover:text-primary-300">العودة لتسجيل الدخول</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
