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
      className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-4 shadow-soft"
    >
      <div className="flex flex-col gap-3">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Ask your AI agent anything… Shift+Enter for newline'}
          disabled={disabled}
          className="min-h-[108px] resize-none"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">Enter to send, Shift+Enter for a new line.</p>
          <Button type="submit" disabled={disabled || !value.trim()}>
            Send message
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
