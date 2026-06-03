import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { User, Save, Phone, MapPin, School, Book, Star, Flame, Award, Camera, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { gamificationApi } from '../../features/gamification/api/gamification';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    phone: (user?.profile as any)?.phone || '',
    grade: user?.profile?.grade || '',
    school: user?.profile?.school || '',
    city: user?.profile?.city || '',
    bio: (user?.profile as any)?.bio || '',
  });

  const { data: achievements } = useQuery({
    queryKey: ['gamification-achievements'],
    queryFn: gamificationApi.getAchievements,
  });

  const { data: certificates } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: gamificationApi.getCertificates,
  });

  const { data: gamStats } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: gamificationApi.getStats,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t('profile.imageTooLarge')); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.patch('/users/me/profile', { avatarUrl: data.data.url });
      setUser({ ...user!, profile: { ...user!.profile!, avatarUrl: data.data.url } });
      toast.success(t('profile.avatarUpdated'));
    } catch {
      toast.error(t('profile.avatarError'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me/profile', formData);
      setUser(data.data);
      toast.success(t('profile.profileSaved'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('profile.profileError'));
    } finally {
      setLoading(false);
    }
  };

  const xp = gamStats?.profile?.xp ?? user?.profile?.xp ?? 0;
  const level = gamStats?.profile?.level ?? user?.profile?.level ?? 1;
  const streak = gamStats?.profile?.currentStreak ?? user?.profile?.currentStreak ?? 0;
  const xpProgress = ((xp % 1000) / 10);

  const earnedAchievements = achievements?.filter((a: any) => a.earned) || [];

  const fields = [
    { label: t('profile.firstName'), name: 'firstName', icon: User, required: true },
    { label: t('profile.lastName'), name: 'lastName', icon: User, required: true },
    { label: t('profile.phone'), name: 'phone', icon: Phone, type: 'tel' },
    { label: t('profile.city'), name: 'city', icon: MapPin },
    { label: t('profile.grade'), name: 'grade', icon: Book },
    { label: t('profile.school'), name: 'school', icon: School },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-2">{t('profile.title')}</h1>
        <p className="text-surface-400">{t('profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Gamification */}
        <div className="space-y-4">
          {/* Avatar + Name */}
          <div className="glass rounded-2xl p-6 border border-white/5 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary-500/20">
                {user?.profile?.avatarUrl ? (
                  <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.profile?.firstName?.charAt(0) || <User className="w-10 h-10" />
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -left-2 w-8 h-8 bg-primary-600 hover:bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg transition-all border-2 border-surface-900"
              >
                {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <h2 className="text-xl font-bold text-white">{user?.profile?.firstName} {user?.profile?.lastName}</h2>
            <p className="text-surface-400 text-sm">{user?.email}</p>
          </div>

          {/* XP & Level */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary-400" />
                <span className="text-white font-bold">{t('profile.level', { level })}</span>
              </div>
              <span className="text-primary-400 text-sm font-bold">{xp.toLocaleString()} XP</span>
            </div>
            <div className="h-2.5 bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-xs text-surface-500 mt-1.5 text-center">
              {t('profile.xpToNext', { xp: xp % 1000, next: level + 1 })}
            </p>
          </div>

          {/* Streak */}
          <div className="glass rounded-2xl p-5 border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{streak} <span className="text-sm text-surface-400 font-medium">{t('profile.streak')}</span></div>
              <div className="text-sm text-orange-400 font-medium">{t('profile.streakLabel')}</div>
            </div>
          </div>
        </div>

        {/* Right Column — Form */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-6 border border-white/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {fields.map(field => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="text-sm font-medium text-surface-300">{field.label}</label>
                    <div className="relative">
                      <field.icon className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500', isRtl ? 'right-3' : 'left-3')} />
                      <input
                        type={(field as any).type || 'text'}
                        name={field.name}
                        value={(formData as any)[field.name]}
                        onChange={handleChange}
                        required={(field as any).required}
                        className={cn(
                          'w-full bg-surface-900 border border-surface-800 rounded-xl py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-all',
                          isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-surface-300">{t('profile.bio')}</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-surface-900 border border-surface-800 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-all resize-none"
                  placeholder={t('profile.bioPlaceholder')}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> {t('profile.saveChanges')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Badges Row */}
      {earnedAchievements.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            {t('profile.achievements', { count: earnedAchievements.length })}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {earnedAchievements.map((a: any) => (
              <div key={a.id} className="glass rounded-xl p-3 border border-amber-500/20 bg-amber-500/5 text-center">
                <div className="text-3xl mb-2">{a.iconUrl}</div>
                <p className="text-xs font-bold text-amber-300">{a.nameAr || a.name}</p>
                <p className="text-[10px] text-surface-500 mt-0.5">+{a.points} XP</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates */}
      {certificates?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            {t('profile.certificates', { count: certificates.length })}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certificates.map((cert: any) => (
              <div key={cert.id} className="glass rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{cert.course?.title}</p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {new Date(cert.issueDate).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <Link
                  to={`/certificate/${cert.uniqueCode}`}
                  target="_blank"
                  className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
