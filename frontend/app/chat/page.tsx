'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Trash2, ThumbsUp, ThumbsDown, TestTube, Zap } from 'lucide-react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { Sidebar } from '@/components/layout/Sidebar';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { sendMessage, submitFeedback } from '@/lib/api';

type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  status?: 'pending' | 'complete';
  extractedEntities?: any;
};

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'ai',
    text: 'Hello! Share your first sales question and I\'ll help qualify leads, answer pricing, and describe your offering.',
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
  const { showToast } = useToast();
  const [testMode, setTestMode] = useState(false);
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
      const response = await sendMessage(tenantId, userId, userMessage.text, (partial) => {
        setMessages((current) =>
          current.map((message) => (message.id === aiId ? { ...message, text: partial } : message)),
        );
      }, testMode).then((response) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === aiId ? {
              ...message,
              text: response.response,
              status: 'complete',
              extractedEntities: response.extracted_entities
            } : message,
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
      const response = await sendMessage(tenantId, userId, lastUserMessage.text, (partial) => {
        setMessages((current) =>
          current.map((message) => (message.id === messageId ? { ...message, text: partial } : message)),
        );
      }, testMode).then((response) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === messageId ? {
              ...message,
              text: response.response,
              status: 'complete',
              extractedEntities: response.extracted_entities
            } : message,
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

  const handleFeedback = async (messageId: string, rating: 1 | -1) => {
    const message = messages.find(m => m.id === messageId);
    const userMessage = messages.find(m => m.role === 'user' && messages.indexOf(m) < messages.indexOf(message!));

    if (!message || !userMessage || !tenantId) return;

    try {
      await submitFeedback({
        tenant_id: tenantId,
        message: userMessage.text,
        response: message.text,
        rating
      });
      showToast(`Feedback ${rating === 1 ? '👍' : '👎'} submitted!`);
    } catch (err) {
      showToast('Failed to submit feedback');
    }
  };

  const handleCopy = async () => {
    showToast('Copied to clipboard!');
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
            <p className="text-sm uppercase tracking-[0.32em] text-violet-300">
              {testMode ? 'Test Mode' : 'Live AI assistant'}
            </p>
            <h1 className="text-3xl font-semibold text-white">
              {testMode ? 'Test your sales agent' : 'Chat with your sales agent'}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setTestMode(!testMode)}
              className={`inline-flex items-center gap-2 rounded-[1.5rem] border px-4 py-3 text-sm font-medium transition ${
                testMode
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
                  : 'border-violet-500/50 bg-violet-500/10 text-violet-200'
              }`}
            >
              {testMode ? <TestTube className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              {testMode ? 'Test Mode' : 'Live Mode'}
            </button>
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
              <div key={message.id} className="space-y-3">
                <MessageBubble
                  role={message.role}
                  text={message.text}
                  status={message.status}
                  onCopy={handleCopy}
                  onRegenerate={message.role === 'ai' ? () => handleRegenerate(message.id) : undefined}
                />
                {message.role === 'ai' && testMode && message.extractedEntities && (
                  <div className="ml-4 rounded-[1rem] border border-amber-500/20 bg-amber-500/5 p-4">
                    <h4 className="text-sm font-medium text-amber-200">Extracted Entities (Test Mode)</h4>
                    <div className="mt-2 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                      <div>Intent: <span className="font-mono text-amber-300">{message.extractedEntities.intent}</span></div>
                      <div>Sentiment: <span className="font-mono text-amber-300">{message.extractedEntities.sentiment}</span></div>
                      <div>Name: <span className="font-mono text-amber-300">{message.extractedEntities.lead_name || 'None'}</span></div>
                      <div>Email: <span className="font-mono text-amber-300">{message.extractedEntities.lead_email || 'None'}</span></div>
                      <div>Platform: <span className="font-mono text-amber-300">{message.extractedEntities.lead_platform || 'None'}</span></div>
                      <div>Step: <span className="font-mono text-amber-300">{message.extractedEntities.collection_step}</span></div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleFeedback(message.id, 1)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-green-500/20 text-green-300 hover:bg-green-500/30"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        Good
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, -1)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30"
                      >
                        <ThumbsDown className="h-3 w-3" />
                        Poor
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
    </main>
  );
}
