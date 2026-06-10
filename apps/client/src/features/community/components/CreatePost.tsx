import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Image as ImageIcon, Smile, X, Loader2 } from 'lucide-react';
import { communityApi } from '../api/community';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { cn } from '../../../lib/utils';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import toast from 'react-hot-toast';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: { content: string; imageUrls: string[] }) => communityApi.createPost(payload),
    onSuccess: () => {
      setContent('');
      setImageUrl(null);
      setIsFocused(false);
      setShowEmoji(false);
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('تم نشر المنشور بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء النشر')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl) return;
    createMutation.mutate({ content, imageUrls: imageUrl ? [imageUrl] : [] });
  };

  const onEmojiClick = (emojiData: any) => {
    setContent(prev => prev + emojiData.emoji);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/media/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(data.data.location); // S3 or Cloudinary URL
      toast.success('تم رفع الصورة بنجاح');
    } catch (err) {
      toast.error('فشل رفع الصورة');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass rounded-2xl p-4 border border-surface-200 mb-6">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg">
          {user?.profile?.firstName?.charAt(0) || 'U'}
        </div>
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="بم تفكر؟ شارك أفكارك أو صورك مع المجتمع..."
            className={cn(
              "w-full bg-surface-900/50 border border-surface-800 rounded-xl p-3 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 transition-all resize-none",
              isFocused || imageUrl ? "min-h-[120px]" : "min-h-[50px]"
            )}
          />
          
          {/* Image Preview */}
          {imageUrl && (
            <div className="relative mt-3 w-fit">
              <img src={imageUrl} alt="preview" className="h-32 rounded-lg object-cover border border-surface-700" />
              <button 
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {uploadingImage && (
            <div className="flex items-center gap-2 mt-3 text-sm text-primary-400">
              <Loader2 className="w-4 h-4 animate-spin" /> جاري رفع الصورة...
            </div>
          )}
          
          {(isFocused || imageUrl) && (
            <div className="flex items-center justify-between mt-3 relative">
              <div className="flex items-center gap-2 relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                  disabled={uploadingImage}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setShowEmoji(!showEmoji)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    showEmoji ? "text-amber-400 bg-amber-500/10" : "text-surface-400 hover:text-amber-400 hover:bg-amber-500/10"
                  )}
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmoji && (
                  <div className="absolute top-12 right-0 z-50 shadow-2xl">
                    <EmojiPicker 
                      theme={Theme.DARK} 
                      onEmojiClick={onEmojiClick}
                      lazyLoadEmojis={true}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFocused(false);
                    setShowEmoji(false);
                  }}
                  className="px-4 py-2 text-sm text-surface-400 hover:text-surface-50 transition-colors"
                >
                  إخفاء
                </button>
                <button
                  type="submit"
                  disabled={(!content.trim() && !imageUrl) || createMutation.isPending || uploadingImage}
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
