import type { ReactNode } from 'react';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  title: 'AutoStream AI Sales Agent',
  description: 'A premium AI sales assistant platform for modern businesses.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased">
        <ToastProvider>
          <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_18%),linear-gradient(180deg,_#03050b_0%,_#050814_100%)] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
