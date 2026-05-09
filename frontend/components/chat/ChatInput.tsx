'use client';

import { FormEvent, KeyboardEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({ value, onChange, onSend, disabled, placeholder }: ChatInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <form
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (!disabled && value.trim()) {
          onSend();
        }
      }}
      className="rounded-[1.75rem] border border-white/10 bg-slate-950/90 p-3 shadow-soft"
    >
      <div className="relative">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type a message and hit Enter'}
          disabled={disabled}
          rows={1}
          className="min-h-[46px] max-h-[96px] w-full pr-14 resize-none bg-slate-950/90 text-slate-100 placeholder:text-slate-500"
        />
        <Button
          type="submit"
          disabled={disabled || !value.trim()}
          className="absolute right-2 bottom-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 p-0 text-white shadow-lg shadow-violet-500/20 hover:bg-violet-400"
          aria-label="Send message"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
