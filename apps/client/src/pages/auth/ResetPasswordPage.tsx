import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, ArrowRight, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';

export default function ResetPasswordPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const schema = z.object({
    password: z.string().min(8, t('auth.passwordLength', 'Password must be at least 8 characters')),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.passwordsDoNotMatch', 'Passwords do not match'),
    path: ['confirmPassword']
  });

  type ResetForm = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(schema),
  });

  const resetMutation = useMutation({
    mutationFn: (data: ResetForm) => api.post('/auth/reset-password', {
      token,
      newPassword: data.password
    }),
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    }
  });

  const onSubmit = (data: ResetForm) => {
    if (!token) return;
    resetMutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-lg">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">
            {t('auth.invalidLink', 'Invalid Link')}
          </h2>
          <p className="text-surface-400 mb-8">
            {t('auth.resetLinkInvalid', 'The password reset link is invalid or has expired.')}
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-all"
          >
            {t('auth.tryAgain', 'Try Again')}
            <ArrowRight className={cn("w-5 h-5", isRtl && "rotate-180")} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background patterns */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <div className="absolute -top-[40%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary-600/10 blur-[120px]" />
        <div className="absolute -bottom-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/" className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 group hover:scale-105 transition-transform duration-300">
            <Code2 className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
          </Link>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          {t('auth.resetPassword', 'Reset Password')}
        </h2>
        <p className="mt-3 text-center text-surface-400">
          {t('auth.enterNewPassword', 'Enter your new password below.')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 sm:rounded-3xl border border-surface-800 shadow-2xl relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t('auth.passwordResetSuccess', 'Password Reset Successfully')}
                </h3>
                <p className="text-surface-400">
                  {t('auth.redirectingLogin', 'Redirecting to login...')}
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
                onSubmit={handleSubmit(onSubmit)}
              >
                {resetMutation.isError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">
                      {(resetMutation.error as any)?.response?.data?.message || t('auth.resetError', 'Failed to reset password. Please try again.')}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    {t('auth.newPassword', 'New Password')}
                  </label>
                  <div className="relative">
                    <div className={cn("absolute inset-y-0 flex items-center pointer-events-none", isRtl ? "right-0 pr-4" : "left-0 pl-4")}>
                      <Lock className="h-5 w-5 text-surface-500" />
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className={cn(
                        "block w-full bg-surface-900/50 border border-surface-700 rounded-xl py-3 text-white placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all",
                        isRtl ? "pr-12 pl-12 text-right" : "pl-12 pr-12"
                      )}
                      placeholder="••••••••"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn("absolute inset-y-0 flex items-center text-surface-400 hover:text-white transition-colors", isRtl ? "left-0 pl-4" : "right-0 pr-4")}
                      aria-label={showPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    {t('auth.confirmNewPassword', 'Confirm New Password')}
                  </label>
                  <div className="relative">
                    <div className={cn("absolute inset-y-0 flex items-center pointer-events-none", isRtl ? "right-0 pr-4" : "left-0 pl-4")}>
                      <Lock className="h-5 w-5 text-surface-500" />
                    </div>
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={cn(
                        "block w-full bg-surface-900/50 border border-surface-700 rounded-xl py-3 text-white placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all",
                        isRtl ? "pr-12 pl-12 text-right" : "pl-12 pr-12"
                      )}
                      placeholder="••••••••"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={cn("absolute inset-y-0 flex items-center text-surface-400 hover:text-white transition-colors", isRtl ? "left-0 pl-4" : "right-0 pr-4")}
                      aria-label={showConfirmPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {resetMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t('auth.resetPasswordButton', 'Reset Password')
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
