import Link from 'next/link';
import { ArrowRight, Bolt, FileText, ShieldCheck, Sparkles } from 'lucide-react';

const features = [
  {
    title: 'Smart sales conversations',
    description: 'A modern agent that understands pricing, FAQs, and customer intent in every chat.',
    icon: Bolt,
  },
  {
    title: 'Lead capture workflow',
    description: 'Auto-detect prospects and store qualified leads with a clean retrieval dashboard.',
    icon: FileText,
  },
  {
    title: 'Secure multi-tenant setup',
    description: 'Tenant-specific knowledge, session isolation, and safe frontend routing.',
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-12">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col justify-center gap-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 shadow-soft">
          <div className="inline-flex items-center rounded-full bg-slate-800/90 px-4 py-2 text-sm font-semibold uppercase tracking-[0.32em] text-violet-300 ring-1 ring-violet-400/15">
            Premium AI sales assistant
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              AI-powered sales conversations that stay on brand.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              Connect with prospects, answer pricing questions, and capture qualified leads through one polished conversational experience.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-[1.75rem] bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Start onboarding
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/chat" className="inline-flex items-center justify-center rounded-[1.75rem] border border-white/10 bg-transparent px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-violet-400 hover:text-white">
              Open chat
            </Link>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Dashboard preview</p>
          <div className="grid gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group rounded-[1.75rem] border border-white/10 bg-slate-900/90 p-5 transition hover:border-violet-400/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-violet-200 transition group-hover:bg-violet-500/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 shadow-soft">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.32em] text-violet-300">Built for founders and operators</p>
          <h2 className="text-3xl font-semibold text-white">A clean interface for real sales workflows.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Workflow</p>
            <p className="mt-4 text-lg font-semibold text-white">Chat, capture, and qualify without leaving the app.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Design</p>
            <p className="mt-4 text-lg font-semibold text-white">Minimal dark UI, consistent spacing, and polished controls.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Integration</p>
            <p className="mt-4 text-lg font-semibold text-white">Connected to backend APIs for chat, onboarding, and leads.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
