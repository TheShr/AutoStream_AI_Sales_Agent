'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Trash2 } from 'lucide-react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { Sidebar } from '@/components/layout/Sidebar';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import { sendMessage } from '@/lib/api';

type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  status?: 'pending' | 'complete';
};

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'ai',
    text: 'Hello! Share your first sales question and I’ll help qualify leads, answer pricing, and describe your offering.',
    status: 'complete',
  },
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [tenantName, setTenantName] = useState('Your Business');
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const messageListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedTenant = localStorage.getItem('tenant_id');
    const storedName = localStorage.getItem('tenant_name');
    const storedUser = localStorage.getItem('user_id');

    if (!storedTenant) {
      router.push('/onboarding');
      return;
    }

    setTenantId(storedTenant);
    setTenantName(storedName || 'Your Business');

    if (storedUser) {
      setUserId(storedUser);
    } else {
      const generated = crypto.randomUUID?.() ?? `user_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('user_id', generated);
      setUserId(generated);
    }
  }, [router]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isSending]);

  const statusText = useMemo(() => {
    if (isSending) return 'Generating response...';
    if (error) return 'Awaiting your next prompt.';
    return 'Ready to continue the conversation.';
  }, [error, isSending]);

  const showToast = (message: string, duration = 2400) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), duration);
  };

  const handleSend = async () => {
    if (!tenantId || !input.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: input.trim(),
      status: 'complete',
    };
    const aiId = `ai-${Date.now()}`;

    setMessages((current) => [...current, userMessage, { id: aiId, role: 'ai', text: '', status: 'pending' }]);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      await sendMessage(tenantId, userId, userMessage.text, (partial) => {
        setMessages((current) =>
          current.map((message) => (message.id === aiId ? { ...message, text: partial } : message)),
        );
      }).then((response) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === aiId ? { ...message, text: response.message, status: 'complete' } : message,
          ),
        );
      });
    } catch (err) {
      const message = (err as Error).message || 'Unable to send message.';
      setError(message);
      showToast(message);
      setMessages((current) => current.filter((message) => message.id !== aiId));
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    if (!tenantId || isSending) return;
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    if (!lastUserMessage) return;

    setError(null);
    setIsSending(true);
    setMessages((current) => current.map((message) => (message.id === messageId ? { ...message, text: 'Regenerating...', status: 'pending' } : message)));

    try {
      await sendMessage(tenantId, userId, lastUserMessage.text, (partial) => {
        setMessages((current) =>
          current.map((message) => (message.id === messageId ? { ...message, text: partial } : message)),
        );
      }).then((response) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === messageId ? { ...message, text: response.message, status: 'complete' } : message,
          ),
        );
      });
      showToast('Response regenerated.');
    } catch (err) {
      const message = (err as Error).message || 'Unable to regenerate response.';
      setError(message);
      showToast(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    showToast('Copied to clipboard.');
  };

  const handleClear = () => {
    const generated = crypto.randomUUID?.() ?? `user_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('user_id', generated);
    setUserId(generated);
    setMessages(initialMessages);
    setError(null);
    showToast('Conversation cleared.');
  };

  return (
    <main className="grid min-h-[calc(100vh-4rem)] grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
      <Sidebar tenantName={tenantName} onNewChat={handleClear} />

      <section className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-soft">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.32em] text-violet-300">Live AI assistant</p>
            <h1 className="text-3xl font-semibold text-white">Chat with your sales agent</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-[1.5rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
            >
              <Trash2 className="h-4 w-4" />
              New chat
            </button>
            <div className="rounded-[1.5rem] bg-slate-950/80 px-4 py-3 text-sm text-slate-400">
              {tenantName}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-4">
          <div ref={messageListRef} className="flex h-full flex-col gap-4 overflow-auto pr-2 pb-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                text={message.text}
                status={message.status}
                onCopy={handleCopy}
                onRegenerate={message.role === 'ai' ? () => handleRegenerate(message.id) : undefined}
              />
            ))}
            {isSending ? (
              <div className="flex justify-start">
                <div className="rounded-[2rem] bg-slate-900/80 px-5 py-4 text-sm text-slate-300 shadow-soft">
                  Typing...
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          {error ? <p className="rounded-[1.5rem] bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={isSending} />
          <div className="flex flex-col gap-2 rounded-[2rem] border border-white/10 bg-slate-950/70 px-5 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>{messages.length} messages in this session</span>
            <span className="inline-flex items-center gap-2">
              {isSending ? <Spinner /> : <ArrowRight className="h-4 w-4 text-slate-500" />}
              {statusText}
            </span>
          </div>
        </div>
      </section>

      {toastMessage ? <Toast message={toastMessage} variant={error ? 'error' : 'success'} onDismiss={() => setToastMessage('')} /> : null}
    </main>
  );
}
