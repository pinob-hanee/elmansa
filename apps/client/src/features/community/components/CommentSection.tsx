import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, CornerDownLeft } from 'lucide-react';
import { communityApi } from '../api/community';
import { useAuthStore } from '../../../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface CommentSectionProps {
  postId: string;
  comments?: any[];
}

export default function CommentSection({ postId, comments: initialComments }: CommentSectionProps) {
  const [content, setContent] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: fetchedComments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => communityApi.getComments(postId),
  });

  const comments = fetchedComments?.data || initialComments || [];

  const commentMutation = useMutation({
    mutationFn: (payload: { content: string }) => communityApi.addComment(postId, payload),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    commentMutation.mutate({ content });
  };

  return (
    <div className="mt-4 pt-4 border-t border-surface-800">
      {/* Comments List */}
      <div className="space-y-4 mb-4">
        {isLoading ? (
          <div className="text-center text-surface-500 text-sm py-4">{t('community.loadingComments', 'جاري تحميل التعليقات...')}</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-surface-500 text-sm py-4">{t('community.noComments', 'لا توجد تعليقات بعد. كن أول من يعلق!')}</div>
        ) : (
          comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-xs font-bold text-surface-50 shrink-0 mt-1">
                {comment.author?.profile?.firstName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 bg-surface-900/50 rounded-2xl p-3 border border-surface-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-surface-50 text-sm">
                    {comment.author?.profile?.firstName} {comment.author?.profile?.lastName}
                  </span>
                  <span className="text-xs text-surface-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ar })}
                  </span>
                </div>
                <p className="text-surface-300 text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {user?.profile?.firstName?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('community.writeComment', 'اكتب تعليقاً...')}
            className="w-full bg-surface-900 border border-surface-800 rounded-xl py-2 pl-12 pr-4 text-surface-50 text-sm placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!content.trim() || commentMutation.isPending}
            className="absolute left-1 top-1 bottom-1 aspect-square flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
