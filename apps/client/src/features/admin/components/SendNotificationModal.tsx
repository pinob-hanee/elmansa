import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bell } from 'lucide-react';
import { adminNotificationsApi, SendNotificationPayload } from '../api/adminNotifications';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string; // If provided, sends to specific user. Otherwise broadcasts to all.
  userName?: string;
}

export default function SendNotificationModal({ isOpen, onClose, userId, userName }: SendNotificationModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');

  const mutation = useMutation({
    mutationFn: (payload: SendNotificationPayload) => adminNotificationsApi.send(payload),
    onSuccess: (data) => {
      toast.success(data.message || t('adminNotifications.sentSuccess', 'Notification sent successfully'));
      onClose();
      setTitle('');
      setMessage('');
      setLink('');
    },
    onError: () => {
      toast.error(t('adminNotifications.sentError', 'Failed to send notification'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    
    mutation.mutate({
      userId,
      title: title.trim(),
      message: message.trim(),
      link: link.trim() || undefined
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-surface-900 border border-surface-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-surface-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-surface-50">
                  {userId ? `Send Notification to ${userName || 'Student'}` : 'Broadcast Notification'}
                </h2>
                <p className="text-sm text-surface-400">
                  {userId ? 'This message will only be seen by this student.' : 'This message will be sent to all enrolled students.'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-50 hover:bg-surface-800 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-400 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-surface-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="e.g., Important Update!"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-surface-400 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-surface-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                placeholder="Write your message here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-400 mb-1">Link (Optional)</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-surface-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="e.g., /courses/my-course"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-medium text-surface-300 hover:text-surface-50 hover:bg-surface-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || !title.trim() || !message.trim()}
                className="px-6 py-2.5 rounded-xl font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {mutation.isPending ? 'Sending...' : 'Send'}
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
