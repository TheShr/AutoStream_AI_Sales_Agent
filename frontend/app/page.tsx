import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col items-center justify-center gap-12 rounded-[2rem] bg-slate-900/60 p-10 shadow-soft ring-1 ring-white/10 backdrop-blur-xl">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 ring-1 ring-violet-500/15">
          <Sparkles className="h-4 w-4" /> Premium AI sales automation
        </div>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          AI Sales Agent for Any Business
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          Turn every conversation into opportunities with a tailored sales agent that understands your brand, pricing, and buyers.
        </p>
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-2 sm:max-w-3xl">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-soft">
          <h2 className="text-lg font-semibold text-white">Fast setup</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">Configure your business once and start chatting with your AI agent instantly.</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-soft">
          <h2 className="text-lg font-semibold text-white">Lead-ready AI</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">Capture leads, answer pricing questions, and qualify prospects without missing a beat.</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center rounded-[2rem] bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
        >
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <p className="text-sm text-slate-400">Built for founders, operators, and sales teams who want a modern AI workflow.</p>
      </div>
    </main>
  );
}
