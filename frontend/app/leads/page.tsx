'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { fetchLeads, Lead } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';

export default function LeadsPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('Your Business');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedTenant = localStorage.getItem('tenant_id');
    const storedName = localStorage.getItem('tenant_name');

    if (!storedTenant) {
      router.push('/onboarding');
      return;
    }

    setTenantId(storedTenant);
    setTenantName(storedName || 'Your Business');
  }, [router]);

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchLeads(tenantId)
      .then((items) => setLeads(items))
      .catch((err) => setError(err.message || 'Unable to load leads.'))
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  return (
    <main className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
      <Sidebar tenantName={tenantName} />

      <section className="flex min-h-[calc(100vh-3rem)] flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-soft">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Leads dashboard</p>
          <h1 className="text-3xl font-semibold text-white">Captured leads</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Track prospect details from your AI agent and quickly review new opportunities.
          </p>
        </header>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70">
          {isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center px-6 py-16 text-slate-400">
              <Spinner />
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center text-sm text-red-200">{error}</div>
          ) : leads.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-400">
              <p className="text-lg font-medium text-white">No leads yet.</p>
              <p className="mt-2 text-sm">Start a conversation and your AI agent will capture leads automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em]">Name</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em]">Email</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em]">Platform</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em]">Captured</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
                    <tr key={`${lead.email}-${index}`} className={index % 2 === 0 ? 'bg-slate-950/80' : 'bg-slate-950/60'}>
                      <td className="px-6 py-4 font-medium text-white">{lead.name}</td>
                      <td className="px-6 py-4 break-all">{lead.email}</td>
                      <td className="px-6 py-4 text-slate-300">{lead.platform}</td>
                      <td className="px-6 py-4 text-slate-400">{new Date(lead.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
