import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { aiApi } from '../../features/ai/api/ai.api';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FloatingAiChat() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: isRtl ? 'مرحباً! أنا المساعد الذكي، كيف يمكنني مساعدتك اليوم؟' : 'Hello! I am your AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const chatMutation = useMutation({
    mutationFn: (msg: string) => aiApi.chat(msg, messages.filter(m => m.role !== 'assistant' || m.content !== messages[0].content)),
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { role: 'assistant', content: isRtl ? 'عذراً، حدث خطأ أثناء الاتصال. يرجى المحاولة لاحقاً.' : 'Sorry, there was an error connecting to the AI. Please try again later.' }]);
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    chatMutation.mutate(userMessage);
  };

  return (
    <div className={cn("fixed z-50", isRtl ? "bottom-6 left-6" : "bottom-6 right-6")} dir={isRtl ? 'rtl' : 'ltr'}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute bottom-20 bg-surface-900 border border-surface-700 shadow-2xl rounded-2xl flex flex-col overflow-hidden w-[350px] sm:w-[400px] h-[500px] max-h-[80vh]",
              isRtl ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-600 to-primary-800 text-white border-b border-primary-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20 shadow-inner">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold flex items-center gap-1.5">
                    El-Mansa AI <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </h3>
                  <p className="text-xs text-primary-200">{isRtl ? 'متصل' : 'Online'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-950/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-primary-600 text-white rounded-br-sm" 
                      : "bg-surface-800 border border-surface-700 text-surface-50 rounded-bl-sm"
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-surface-50">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-surface-800 border border-surface-700 text-surface-50 rounded-2xl rounded-bl-sm p-4 flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-surface-900 border-t border-surface-800">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  placeholder={isRtl ? 'اسأل المساعد الذكي...' : 'Ask AI assistant...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={chatMutation.isPending}
                  className="w-full bg-surface-800 border border-surface-700 rounded-xl py-3 px-4 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm text-surface-50 pr-12 rtl:pr-4 rtl:pl-12 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || chatMutation.isPending}
                  className="absolute right-2 rtl:right-auto rtl:left-2 p-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors"
                >
                  <Send className={cn("w-4 h-4", isRtl && "rotate-180")} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all",
          isOpen ? "bg-surface-800 hover:bg-surface-700 border border-surface-700" : "bg-gradient-to-r from-primary-600 to-primary-500"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
      </button>
    </div>
  );
}
