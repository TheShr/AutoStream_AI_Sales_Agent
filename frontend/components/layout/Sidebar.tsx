import Link from 'next/link';
import { MessageCircle, CheckSquare, Zap } from 'lucide-react';

type SidebarProps = {
  tenantName: string;
};

export function Sidebar({ tenantName }: SidebarProps) {
  return (
    <aside className="flex min-h-[calc(100vh-6rem)] w-full max-w-[320px] flex-col gap-8 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-soft">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-3 rounded-[1.5rem] bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-100 ring-1 ring-violet-500/15">
          <Zap className="h-5 w-5" />
          {tenantName || 'Your AI Agent'}
        </div>
        <p className="text-sm leading-6 text-slate-400">
          Manage chat, review leads, and keep your AI sales agent aligned with your business.
        </p>
      </div>

      <nav className="space-y-2 text-sm">
        <Link href="/chat" className="flex items-center gap-3 rounded-[1.5rem] px-4 py-3 text-slate-100 transition hover:bg-white/5">
          <MessageCircle className="h-4 w-4" /> Chat
        </Link>
        <Link href="/leads" className="flex items-center gap-3 rounded-[1.5rem] px-4 py-3 text-slate-100 transition hover:bg-white/5">
          <CheckSquare className="h-4 w-4" /> Leads
        </Link>
      </nav>
    </aside>
  );
}
