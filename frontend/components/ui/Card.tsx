import type { PropsWithChildren } from 'react';
import clsx from 'clsx';

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx('rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-soft', className)}>
      {children}
    </div>
  );
}
