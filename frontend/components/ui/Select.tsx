import type { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        'w-full rounded-[1.5rem] border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 shadow-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/20',
        props.className,
      )}
      {...props}
    />
  );
}
