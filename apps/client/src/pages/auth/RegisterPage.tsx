import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Mail, Lock, Eye, EyeOff, User, Phone, School, MapPin, UserPlus } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import { cn } from '../../lib/utils';

const schema = z.object({
  firstName: z.string().min(2, 'الاسم الأول مطلوب (حرفان على الأقل)'),
  lastName: z.string().min(2, 'الاسم الأخير مطلوب'),
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم'),
  phone: z.string().optional(),
  grade: z.string().optional(),
  school: z.string().optional(),
  city: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const InputField = ({ label, icon: Icon, error, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-surface-300 mb-1.5">{label}</label>
    <div className="relative">
      <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
      <input
        {...props}
        className={cn(
          'w-full pr-10 pl-4 py-2.5 rounded-xl bg-surface-800 border text-white placeholder-surface-500 text-sm outline-none transition-all',
          error ? 'border-error/50' : 'border-surface-700 focus:border-primary-500'
        )}
      />
    </div>
    {error && <p className="mt-1 text-xs text-error">{error}</p>}
  </div>
);

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/auth/register', data),
    onSuccess: () => setSuccess(true),
  });

  if (success) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/5 border border-success/30 flex items-center justify-center mx-auto mb-6">
            <div className="text-5xl">✅</div>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">تم التسجيل بنجاح!</h2>
          <p className="text-surface-400 mb-2">تم إرسال رابط التحقق إلى بريدك الإلكتروني.</p>
          <p className="text-surface-400 mb-8">
            بعد التحقق من بريدك، سيقوم المدرس بمراجعة طلبك والموافقة عليه.
          </p>
          <Link
            to="/login"
            className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-all"
          >
            الانتقال لتسجيل الدخول
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center py-12 px-6" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold gradient-text">Elmansa</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-white mb-2">إنشاء حساب جديد</h1>
          <p className="text-surface-400">انضم إلى مجتمع التعلم الآن</p>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/10">
          {/* Google Sign up */}
          <a
            href="/api/v1/auth/google"
            className="w-full flex items-center justify-center gap-3 px-6 py-2.5 rounded-xl border border-surface-700 hover:border-surface-500 bg-surface-800/50 hover:bg-surface-800 text-white transition-all mb-5 group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium group-hover:text-white/90">إنشاء حساب بـ Google</span>
          </a>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-surface-900/90 rounded-full text-surface-400 text-xs">أو بالبريد الإلكتروني</span>
            </div>
          </div>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="الاسم الأول"
                icon={User}
                placeholder="محمد"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <InputField
                label="الاسم الأخير"
                icon={User}
                placeholder="أحمد"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <InputField
              label="البريد الإلكتروني"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    'w-full pr-10 pl-10 py-2.5 rounded-xl bg-surface-800 border text-white placeholder-surface-500 text-sm outline-none transition-all',
                    errors.password ? 'border-error/50' : 'border-surface-700 focus:border-primary-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
            </div>

            <div className="border-t border-surface-700/50 pt-4">
              <p className="text-xs text-surface-500 mb-3">معلومات إضافية (اختيارية)</p>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="رقم الهاتف"
                  icon={Phone}
                  placeholder="01012345678"
                  {...register('phone')}
                />
                <InputField
                  label="الصف الدراسي"
                  icon={BookOpen}
                  placeholder="الصف الثالث الثانوي"
                  {...register('grade')}
                />
                <InputField
                  label="المدرسة"
                  icon={School}
                  placeholder="اسم مدرستك"
                  {...register('school')}
                />
                <InputField
                  label="المحافظة"
                  icon={MapPin}
                  placeholder="القاهرة"
                  {...register('city')}
                />
              </div>
            </div>

            {mutation.error && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm">
                حدث خطأ. ربما هذا البريد الإلكتروني مسجل مسبقاً.
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold hover:shadow-xl hover:shadow-primary-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {mutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  إنشاء الحساب
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-surface-400 text-sm">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
            سجّل دخولك
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
