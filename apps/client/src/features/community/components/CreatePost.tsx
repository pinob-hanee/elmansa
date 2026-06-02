import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Image as ImageIcon, Smile } from 'lucide-react';
import { communityApi } from '../api/community';
import { useAuthStore } from '../../../store/authStore';
import { cn } from '../../../lib/utils';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: { content: string }) => communityApi.createPost(payload),
    onSuccess: () => {
      setContent('');
      setIsFocused(false);
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate({ content });
  };

  return (
    <div className="glass rounded-2xl p-4 border border-white/5 mb-6">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg">
          {user?.profile?.firstName?.charAt(0) || 'U'}
        </div>
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="بم تفكر؟ شارك أفكارك مع المجتمع..."
            className={cn(
              "w-full bg-surface-900/50 border border-surface-800 rounded-xl p-3 text-white placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 transition-all resize-none",
              isFocused ? "min-h-[120px]" : "min-h-[50px]"
            )}
          />
          
          {isFocused && (
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button type="button" className="p-2 rounded-lg text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button type="button" className="p-2 rounded-lg text-surface-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFocused(false)}
                  className="px-4 py-2 text-sm text-surface-400 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!content.trim() || createMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
                >
                  {createMutation.isPending ? 'جاري النشر...' : 'نشر'}
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
