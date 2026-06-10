import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Flag, Pin } from 'lucide-react';
import { communityApi } from '../api/community';
import CommentSection from './CommentSection';
import { cn } from '../../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface PostCardProps {
  post: any;
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function PostCard({ post, currentUserId, isAdmin }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const isLiked = post.reactions?.some((r: any) => r.userId === currentUserId && r.type === 'LIKE');
  const likesCount = post.reactions?.filter((r: any) => r.type === 'LIKE').length || 0;

  const reactionMutation = useMutation({
    mutationFn: () => communityApi.toggleReaction({ postId: post.id, type: 'LIKE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  const handleReport = () => {
    if (isReported) return;
    toast((toastItem) => (
      <div className="flex flex-col gap-3" dir="rtl">
        <p className="font-medium text-surface-900">{t('community.reportConfirm', 'هل تريد إبلاغ الإدارة عن هذا المنشور كمحتوى غير لائق؟')}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(toastItem.id)} className="px-3 py-1.5 text-xs font-medium bg-surface-200 hover:bg-surface-300 text-surface-700 rounded-lg">{t('common.cancel', 'إلغاء')}</button>
          <button onClick={() => {
              toast.dismiss(toastItem.id);
              communityApi.reportPost({ targetId: post.authorId, postId: post.id, reason: 'INAPPROPRIATE' })
                .then(() => {
                  toast.success(t('community.reportSuccess', 'تم إرسال البلاغ للإدارة'));
                  setIsReported(true);
                })
                .catch(() => toast.error(t('community.reportError', 'حدث خطأ أثناء الإبلاغ')));
          }} className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg">{t('community.reportYes', 'نعم، أبلغ')}</button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  return (
    <div className="glass rounded-2xl p-5 border border-surface-200 transition-all hover:border-surface-200">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
            {post.author?.profile?.firstName?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-surface-50">
                {post.author?.profile?.firstName} {post.author?.profile?.lastName}
              </span>
              {post.author?.role === 'TEACHER' && (
                <span className="bg-primary-500/20 text-primary-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {t('common.teacher', 'معلم')}
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
                    {t('community.pinned', 'مثبت')}
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
          {t('community.like', 'إعجاب')}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm font-medium text-surface-400 hover:text-primary-400 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          {post._count?.comments > 0 && <span>{post._count.comments}</span>}
          {t('community.comment', 'تعليق')}
        </button>

        <div className="flex-1" />

        {currentUserId !== post.authorId && (
          <button 
            onClick={handleReport}
            disabled={isReported}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              isReported ? "text-amber-500 cursor-not-allowed" : "text-surface-500 hover:text-error"
            )}
            title={isReported ? "{t('community.reported', 'تم الإبلاغ')}" : t('community.reportAction', 'إبلاغ كمحتوى غير لائق')}
          >
            <Flag className={cn("w-4 h-4", isReported && "fill-current")} />
            {isReported && <span className="text-xs">تم الإبلاغ</span>}
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
