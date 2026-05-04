import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'AI Sales Agent',
  description: 'Modern AI sales assistant for any business.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
