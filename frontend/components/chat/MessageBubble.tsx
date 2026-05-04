'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';

type MessageBubbleProps = {
  role: 'user' | 'ai';
  text: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
  status?: 'pending' | 'complete';
};

export function MessageBubble({ role, text, onCopy, onRegenerate, status = 'complete' }: MessageBubbleProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!onCopy) return;
    onCopy();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`group relative max-w-[86%] rounded-[2rem] border border-white/10 px-5 py-4 text-sm leading-7 shadow-soft transition ${
          isUser
            ? 'bg-violet-500 text-white'
            : 'bg-slate-900/80 text-slate-200 ring-1 ring-white/5'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{text}</div>

        <div className="mt-3 flex items-center justify-between gap-3 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied' : 'Copy'}
          </button>

          <AnimatePresence>
            {onRegenerate && role === 'ai' ? (
              <motion.button
                type="button"
                onClick={onRegenerate}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {status === 'pending' ? 'Regenerating' : 'Regenerate'}
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
