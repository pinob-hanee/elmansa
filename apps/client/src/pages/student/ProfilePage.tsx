import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { User, Save, Phone, MapPin, School, Book } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    phone: user?.profile?.phone || '',
    grade: user?.profile?.grade || '',
    school: user?.profile?.school || '',
    city: user?.profile?.city || '',
    bio: user?.profile?.bio || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me/profile', formData);
      setUser(data.data); // update global user state
      toast.success('تم حفظ الملف الشخصي بنجاح');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-2">الملف الشخصي</h1>
        <p className="text-surface-400">تحديث بياناتك الشخصية ومعلومات التواصل</p>
      </div>

      <div className="glass rounded-2xl p-6 border border-white/5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-500/20">
              {user?.profile?.firstName?.charAt(0) || <User className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.profile?.firstName} {user?.profile?.lastName}</h2>
              <p className="text-surface-400 text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-300">الاسم الأول</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-primary-500/50 transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-300">الاسم الأخير</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-primary-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-300">رقم الهاتف</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-300">المدينة</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-300">الصف الدراسي</label>
              <div className="relative">
                <Book className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-300">المدرسة</label>
              <div className="relative">
                <School className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-300">نبذة تعريفية</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full bg-surface-900 border border-surface-800 rounded-xl p-4 text-white focus:outline-none focus:border-primary-500/50 transition-all resize-none"
              placeholder="اكتب نبذة قصيرة عن نفسك..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
