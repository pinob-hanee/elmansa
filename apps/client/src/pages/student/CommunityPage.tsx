import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Filter } from 'lucide-react';
import { communityApi } from '../../features/community/api/community';
import CreatePost from '../../features/community/components/CreatePost';
import PostCard from '../../features/community/components/PostCard';
import { useAuthStore } from '../../store/authStore';

export default function CommunityPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['community-posts', search],
    queryFn: () => communityApi.getPosts({ search }),
  });

  const posts = data?.data || [];

  return (
    <div dir="rtl" className="max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white mb-2">مجتمع المنصة</h1>
        <p className="text-surface-400">تواصل مع زملائك، اطرح أسئلة، وشارك المعرفة</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في المنشورات..."
            className="w-full bg-surface-900 border border-surface-800 rounded-xl py-3 pr-12 pl-4 text-white placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 rounded-xl bg-surface-900 border border-surface-800 text-surface-300 hover:text-white transition-colors">
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">تصفية</span>
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
      ) : posts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-white/5 mt-8">
          <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-surface-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">لا توجد منشورات</h3>
          <p className="text-surface-400">كن أول من ينشر في المجتمع!</p>
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
