import type { TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        'min-h-[160px] w-full resize-none rounded-[1.5rem] border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-violet-300 focus:ring-2 focus:ring-violet-400/20',
        props.className,
      )}
      {...props}
    />
  );
}
