import { motion } from 'framer-motion';
import { Clock, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

export default function PendingApprovalPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="glass rounded-3xl p-10 border border-warning/20">
          <div className="w-24 h-24 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-warning" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">جاري مراجعة طلبك</h1>
          <p className="text-surface-400 leading-relaxed mb-2">
            مرحباً <span className="text-white font-medium">{user?.profile?.firstName}</span>!
          </p>
          <p className="text-surface-400 leading-relaxed mb-8">
            تم استلام طلب تسجيلك وهو الآن قيد المراجعة من قِبل المدرس.
            ستتلقى إشعاراً بالبريد الإلكتروني عند قبولك في المنصة.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 text-surface-300 text-sm">
              <Mail className="w-5 h-5 text-primary-400 shrink-0" />
              <span>تحقق من بريدك الإلكتروني للتحقق من حسابك إن لم تفعل بعد</span>
            </div>
            <button
              onClick={() => {
                api.post('/auth/logout').finally(() => logout());
              }}
              className="w-full py-3 rounded-xl border border-surface-700 text-surface-400 hover:text-white hover:border-surface-600 transition-all text-sm"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
