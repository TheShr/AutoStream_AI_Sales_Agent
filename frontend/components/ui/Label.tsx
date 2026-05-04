import type { PropsWithChildren } from 'react';

export function Label({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <label className={`mb-2 block text-sm font-medium text-slate-300 ${className || ''}`}>{children}</label>;
}
