import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';
import Logo from '../../components/layout/Logo';

function makeSchema(t: any) {
  return z.object({
    email: z.string().email(t('auth.emailInvalid')),
    password: z.string().min(1, t('auth.passwordRequired')),
    rememberMe: z.boolean().optional(),
  });
}

type FormData = { email: string; password: string; rememberMe?: boolean };

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(makeSchema(t)),
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/auth/login', data),
    onSuccess: ({ data }) => {
      login(data.data.user, data.data.accessToken);
      const role = data.data.user.role;
      if (['SUPER_ADMIN', 'TEACHER', 'MODERATOR'].includes(role)) {
        navigate('/admin');
      } else if (!data.data.user.isEmailVerified) {
        toast.success(isRtl ? 'تم تسجيل الدخول. يرجى تأكيد بريدك الإلكتروني.' : 'Logged in. Please verify your email.');
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <div className="min-h-screen bg-surface-950 flex relative" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Absolute Language Switcher */}
      <div className="absolute top-6 end-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Left/Right side — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-surface-800 border border-surface-700" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-surface-800 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Logo size="xl" className="mx-auto mb-8" />
            <h1 className="text-5xl font-extrabold text-surface-50 mb-4">Elmansa</h1>
            <p className="text-surface-300 text-xl leading-relaxed max-w-sm">
              {t('auth.platformTagline')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo Branding */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-surface-50 mb-2">{t('auth.welcomeBack')}</h2>
            <p className="text-surface-400">{t('auth.loginSubtitle')}</p>
          </div>

          {/* Google Sign in */}
          <a
            href={`${import.meta.env.VITE_API_URL}/auth/google`}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border border-surface-700 hover:border-surface-500 bg-surface-800/50 hover:bg-surface-800 text-surface-50 transition-all mb-6 group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium group-hover:text-surface-50/90">{t('auth.loginWithGoogle')}</span>
          </a>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-surface-950 text-surface-500 text-sm">{t('auth.orWithEmail')}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500', isRtl ? 'right-3' : 'left-3')} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className={cn(
                    'w-full py-3 rounded-xl bg-surface-800 border text-surface-50 placeholder-surface-500 outline-none transition-all',
                    isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4',
                    errors.email ? 'border-error focus:border-error' : 'border-surface-700 focus:border-primary-500'
                  )}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-error">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500', isRtl ? 'right-3' : 'left-3')} />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    'w-full py-3 rounded-xl bg-surface-800 border text-surface-50 placeholder-surface-500 outline-none transition-all',
                    isRtl ? 'pr-11 pl-11' : 'pl-11 pr-11',
                    errors.password ? 'border-error' : 'border-surface-700 focus:border-primary-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn('absolute top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300', isRtl ? 'left-3' : 'right-3')}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('rememberMe')} type="checkbox" className="rounded border-surface-600 bg-surface-800 text-primary-600" />
                <span className="text-sm text-surface-400">{t('auth.rememberMe')}</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {mutation.error && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm">
                {t('auth.loginError')}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || !isValid}
              className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-bold text-base hover:bg-primary-500 hover:shadow-xl hover:shadow-primary-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <div className="w-5 h-5 border-2 border-surface-300 border-t-primary-500 rounded-full animate-spin" />
              ) : isRtl ? (
                <>
                  {t('auth.login')}
                  <LogIn className="w-5 h-5 rtl:scale-x-[-1]" />
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {t('auth.login')}
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-surface-400 text-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              {t('auth.registerNow')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
