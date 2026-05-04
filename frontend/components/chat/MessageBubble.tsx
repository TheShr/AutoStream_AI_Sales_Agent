type MessageBubbleProps = {
  role: 'user' | 'ai';
  text: string;
};

export function MessageBubble({ role, text }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[86%] rounded-[2rem] px-5 py-4 text-sm leading-6 shadow-soft transition ${
          isUser ? 'bg-violet-500 text-white' : 'bg-slate-900/80 text-slate-200'
        }`}
      >
        {text}
      </div>
    </div>
  );
}
