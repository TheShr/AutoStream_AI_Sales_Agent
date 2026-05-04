import type { FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  return (
    <form
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (!disabled && value.trim()) {
          onSend();
        }
      }}
      className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-slate-900/80 p-4 shadow-soft"
    >
      <div className="flex items-center gap-3">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask your AI agent anything..."
          disabled={disabled}
        />
        <Button type="submit" disabled={disabled || !value.trim()} className="whitespace-nowrap">
          Send
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
