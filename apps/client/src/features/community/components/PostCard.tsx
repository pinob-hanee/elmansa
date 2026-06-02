import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Flag, Pin } from 'lucide-react';
import { communityApi } from '../api/community';
import CommentSection from './CommentSection';
import { cn } from '../../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: any;
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function PostCard({ post, currentUserId, isAdmin }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  const isLiked = post.reactions?.some((r: any) => r.userId === currentUserId && r.type === 'LIKE');
  const likesCount = post.reactions?.filter((r: any) => r.type === 'LIKE').length || 0;

  const reactionMutation = useMutation({
    mutationFn: () => communityApi.toggleReaction({ postId: post.id, type: 'LIKE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  const handleReport = () => {
    toast((t) => (
      <div className="flex flex-col gap-3" dir="rtl">
        <p className="font-medium text-surface-900">هل تريد إبلاغ الإدارة عن هذا المنشور كمحتوى غير لائق؟</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-medium bg-surface-200 hover:bg-surface-300 text-surface-700 rounded-lg">إلغاء</button>
          <button onClick={() => {
              toast.dismiss(t.id);
              communityApi.reportPost({ targetId: post.authorId, postId: post.id, reason: 'INAPPROPRIATE' })
                .then(() => toast.success('تم إرسال البلاغ للإدارة'))
                .catch(() => toast.error('حدث خطأ أثناء الإبلاغ'));
          }} className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg">نعم، أبلغ</button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  return (
    <div className="glass rounded-2xl p-5 border border-white/5 transition-all hover:border-white/10">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
            {post.author?.profile?.firstName?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                {post.author?.profile?.firstName} {post.author?.profile?.lastName}
              </span>
              {post.author?.role === 'TEACHER' && (
                <span className="bg-primary-500/20 text-primary-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  معلم
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ar })}</span>
              {post.isPinned && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <Pin className="w-3 h-3" />
                    مثبت
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="text-surface-100 text-[15px] leading-relaxed whitespace-pre-wrap mb-4">
        {post.content}
      </div>

      {/* Post Images */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className="mb-4 rounded-xl overflow-hidden border border-surface-800">
          <img src={post.imageUrls[0]} alt="Post attachment" className="w-full max-h-96 object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-surface-800">
        <button
          onClick={() => reactionMutation.mutate()}
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors",
            isLiked ? "text-error" : "text-surface-400 hover:text-error"
          )}
        >
          <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
          {likesCount > 0 && <span>{likesCount}</span>}
          إعجاب
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm font-medium text-surface-400 hover:text-primary-400 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          {post._count?.comments > 0 && <span>{post._count.comments}</span>}
          تعليق
        </button>

        <div className="flex-1" />

        {currentUserId !== post.authorId && (
          <button 
            onClick={handleReport}
            className="text-surface-500 hover:text-error transition-colors" 
            title="إبلاغ كمحتوى غير لائق"
          >
            <Flag className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection postId={post.id} />
      )}
    </div>
  );
}
