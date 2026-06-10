import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Filter } from 'lucide-react';
import { communityApi } from '../../features/community/api/community';
import CreatePost from '../../features/community/components/CreatePost';
import PostCard from '../../features/community/components/PostCard';
import { useAuthStore } from '../../store/authStore';

import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

export default function CommunityPage() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['community-posts', debouncedSearch],
    queryFn: () => communityApi.getPosts({ search: debouncedSearch }),
  });

  const posts = data?.data || [];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-surface-50 mb-2">{t('community.title', 'مجتمع المنصة')}</h1>
        <p className="text-surface-400">{t('community.subtitle', 'تواصل مع زملائك، اطرح أسئلة، وشارك المعرفة')}</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500", isRtl ? "right-4" : "left-4")} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('community.searchPlaceholder', 'ابحث في المنشورات...')}
            className={cn(
              "w-full bg-surface-900 border border-surface-800 rounded-xl py-3 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 transition-all",
              isRtl ? "pr-12 pl-4" : "pl-12 pr-4"
            )}
          />
        </div>
        <button className="flex items-center gap-2 px-4 rounded-xl bg-surface-900 border border-surface-800 text-surface-300 hover:text-surface-50 transition-colors">
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">{t('community.filter', 'تصفية')}</span>
        </button>
      </div>

      {/* Create Post */}
      <CreatePost />

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-surface-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="glass rounded-2xl p-12 text-center border border-surface-200 mt-8">
          <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500/50" />
          </div>
          <h3 className="text-xl font-bold text-surface-50 mb-2">{t('common.loadError', 'حدث خطأ أثناء تحميل البيانات')}</h3>
          <button onClick={() => refetch()} className="px-4 py-2 mt-4 bg-surface-800 hover:bg-surface-700 text-surface-50 rounded-lg">
            {t('common.retry', 'حاول مرة أخرى')}
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-surface-200 mt-8">
          <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-surface-600" />
          </div>
          <h3 className="text-xl font-bold text-surface-50 mb-2">{t('community.noPosts', 'لا يوجد منشورات بعد')}</h3>
          <p className="text-surface-400">{t('community.beFirstToPost', 'كن أول من يشارك في المجتمع!')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              isAdmin={['SUPER_ADMIN', 'TEACHER', 'MODERATOR'].includes(user?.role || '')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
