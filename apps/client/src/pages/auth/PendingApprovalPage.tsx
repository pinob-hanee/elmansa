import { motion } from 'framer-motion';
import { Clock, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

export default function PendingApprovalPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="glass rounded-3xl p-10 border border-warning/20">
          <div className="w-24 h-24 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-warning" />
          </div>
          <h1 className="text-3xl font-extrabold text-surface-50 mb-3">
            {isRtl ? 'جاري مراجعة طلبك' : 'Application Under Review'}
          </h1>
          <p className="text-surface-400 leading-relaxed mb-2">
            {isRtl ? 'مرحباً ' : 'Hello '}
            <span className="text-surface-50 font-medium">{user?.profile?.firstName}</span>!
          </p>
          <p className="text-surface-400 leading-relaxed mb-8">
            {isRtl
              ? 'تم استلام طلب تسجيلك وهو الآن قيد المراجعة من قِبل المدرس. ستتلقى إشعاراً بالبريد الإلكتروني عند قبولك في المنصة.'
              : 'Your registration request has been received and is currently under review by the teacher. You will receive an email notification once accepted.'}
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 text-surface-300 text-sm">
              <Mail className="w-5 h-5 text-primary-400 shrink-0" />
              <span>
                {isRtl ? 'تحقق من بريدك الإلكتروني للتحقق من حسابك إن لم تفعل بعد' : 'Check your email to verify your account if you haven\'t already'}
              </span>
            </div>
            <button
              onClick={() => {
                api.post('/auth/logout').finally(() => logout());
              }}
              className="w-full py-3 rounded-xl border border-surface-700 text-surface-400 hover:text-surface-50 hover:border-surface-600 transition-all text-sm"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
