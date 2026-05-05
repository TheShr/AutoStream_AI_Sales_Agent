'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, RefreshCw, Key } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { getApiKey, regenerateApiKey } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

export default function ApiSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('Your Business');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
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

    loadApiKey();
  }, [tenantId]);

  const loadApiKey = async () => {
    if (!tenantId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getApiKey(tenantId);
      setApiKey(response.api_key);
    } catch (err: any) {
      setError(err.message || 'Unable to load API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!tenantId) return;

    setIsRegenerating(true);
    try {
      const response = await regenerateApiKey(tenantId);
      setApiKey(response.api_key);
      showToast('API key regenerated successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to regenerate API key', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('API key copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy API key', 'error');
    }
  };

  return (
    <main className="grid min-h-[calc(100vh-4rem)] grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
      <Sidebar tenantName={tenantName} />

      <section className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-soft">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-violet-300">API settings</p>
          <h1 className="text-3xl font-semibold text-white">API Key Management</h1>
          <p className="text-sm text-slate-400">
            Use your API key to integrate with external systems or build custom applications.
          </p>
        </header>

        <Card className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={loadApiKey}>Try Again</Button>
            </div>
          ) : apiKey ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="rounded-[1rem] bg-violet-500/10 p-3">
                  <Key className="h-6 w-6 text-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400">Your API Key</p>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="flex-1 rounded-[0.5rem] bg-slate-950 px-3 py-2 text-sm font-mono text-slate-300">
                      {apiKey}
                    </code>
                    <Button
                      variant="secondary"
                      onClick={() => copyToClipboard(apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Regenerate API Key</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Regenerating your API key will invalidate the current key. All applications using the old key will need to be updated.
                </p>
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? <Spinner /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Regenerate Key
                </Button>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Usage Example</h3>
                <pre className="rounded-[1rem] bg-slate-950 p-4 text-sm text-slate-300 overflow-x-auto">
                  <code>{`curl -X POST "${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/chat" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenant_id": "${tenantId}",
    "user_id": "external_user_123",
    "message": "Hello, I am interested in your services"
  }'`}</code>
                </pre>
              </div>
            </div>
          ) : null}
        </Card>
      </section>
    </main>
  );
}