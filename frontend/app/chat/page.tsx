'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { Sidebar } from '@/components/layout/Sidebar';
import { Spinner } from '@/components/ui/Spinner';
import { sendMessage } from '@/lib/api';

type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  text: string;
};

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: 'Hello! Share your first sales question and I’ll help qualify leads, answer pricing, and describe your offering.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [tenantName, setTenantName] = useState('Your Business');
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
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

  async function handleSend() {
    if (!tenantId || !input.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: input.trim(),
    };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const response = await sendMessage(tenantId, userId, userMessage.text);
      setMessages((current) => [
        ...current,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: response.message,
        },
      ]);
    } catch (err) {
      setError((err as Error).message || 'Unable to send message.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
      <Sidebar tenantName={tenantName} />

      <section className="flex min-h-[calc(100vh-3rem)] flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-soft">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Live AI assistant</p>
          <h1 className="text-3xl font-semibold text-white">Chat with your sales agent</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Ask anything about your product, pricing, and lead capture. The conversation is kept in memory while you stay here.
          </p>
        </header>

        <div className="flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-4">
          <div ref={messageListRef} className="flex h-full flex-col gap-4 overflow-auto pr-2 pb-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} role={message.role} text={message.text} />
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
          {error ? <p className="rounded-[1.5rem] bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
          <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={isSending} />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{messages.length} messages in this session</span>
            {isSending ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Sending...
              </span>
            ) : (
              <span>Ready to ask your next question.</span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
