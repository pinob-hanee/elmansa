import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Set token temporarily to fetch user data
      useAuthStore.getState().setAccessToken(token);

      api.get('/auth/me')
        .then((response) => {
          const user = response.data.data;
          login(user, token);
          
          if (!user.isEmailVerified) {
            toast.success('Logged in successfully. Please verify your email.');
            navigate('/dashboard', { replace: true });
          } else if (['SUPER_ADMIN', 'TEACHER', 'MODERATOR'].includes(user.role)) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        })
        .catch((error) => {
          console.error('Failed to fetch user profile during callback:', error);
          navigate('/login?error=oauth_failed', { replace: true });
        });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-surface-400 text-sm">{t('auth.completingSignIn', 'Completing sign in...')}</p>
      </div>
    </div>
  );
}
