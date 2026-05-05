'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { getAnalytics } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';

export default function AnalyticsPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('Your Business');
  const [analytics, setAnalytics] = useState<any>(null);
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
    if (!tenantId) return;

    setIsLoading(true);
    setError(null);

    getAnalytics(tenantId)
      .then((data) => setAnalytics(data))
      .catch((err) => setError(err.message || 'Unable to load analytics.'))
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  if (isLoading) {
    return (
      <main className="grid min-h-[calc(100vh-4rem)] grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <Sidebar tenantName={tenantName} />
        <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
          <Spinner />
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-[calc(100vh-4rem)] grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <Sidebar tenantName={tenantName} />
        <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
          <p className="text-red-400">{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-[calc(100vh-4rem)] grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
      <Sidebar tenantName={tenantName} />

      <section className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-soft">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-violet-300">Analytics dashboard</p>
          <h1 className="text-3xl font-semibold text-white">Usage metrics</h1>
        </header>

        {analytics && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-[1rem] bg-blue-500/10 p-3">
                  <MessageSquare className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Chats</p>
                  <p className="text-2xl font-semibold text-white">{analytics.total_chats}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-[1rem] bg-green-500/10 p-3">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Leads Captured</p>
                  <p className="text-2xl font-semibold text-white">{analytics.total_leads}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-[1rem] bg-purple-500/10 p-3">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Conversion Rate</p>
                  <p className="text-2xl font-semibold text-white">{analytics.conversion_rate}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-[1rem] bg-orange-500/10 p-3">
                  <BarChart3 className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Last Updated</p>
                  <p className="text-sm font-semibold text-white">
                    {new Date(analytics.last_updated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {!analytics && !isLoading && !error && (
          <Card className="p-12 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-slate-500" />
            <h3 className="mt-4 text-lg font-semibold text-white">No analytics data yet</h3>
            <p className="mt-2 text-sm text-slate-400">
              Start chatting with your agent to see usage metrics here.
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}