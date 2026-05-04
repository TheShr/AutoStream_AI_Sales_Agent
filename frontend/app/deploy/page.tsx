'use client';

import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Eye } from 'lucide-react';
import { getWidgetConfig } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

export const dynamic = 'force-dynamic';

export default function DeployPage() {
  const [tenantId, setTenantId] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [embedScript, setEmbedScript] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const storedTenantId = localStorage.getItem('tenant_id');
    if (storedTenantId) {
      setTenantId(storedTenantId);
      loadConfig(storedTenantId);
    }
  }, []);

  useEffect(() => {
    if (config && typeof window !== 'undefined') {
      setEmbedScript(`<script src="${window.location.origin}/widget.js" data-tenant="${config.tenant_id}"></script>`);
      setPreviewUrl(`${window.location.origin}/preview?tenant=${config.tenant_id}`);
    }
  }, [config]);

  const loadConfig = async (id: string) => {
    if (!id.trim()) return;

    setLoading(true);
    try {
      const widgetConfig = await getWidgetConfig(id);
      setConfig(widgetConfig);
    } catch (error) {
      showToast('Failed to load widget configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col gap-8">
      <section className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-violet-300">Deploy your agent</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Embed on your website</h1>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
          Get the embed script and deploy your AI sales agent on any website. Visitors can chat with your agent instantly.
        </p>
      </section>

      <Card>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Tenant ID</Label>
            <div className="flex gap-3">
              <Input
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="your-tenant-id"
              />
              <Button onClick={() => loadConfig(tenantId)} disabled={loading || !tenantId.trim()}>
                {loading ? <Spinner /> : 'Load Config'}
              </Button>
            </div>
          </div>

          {config && (
            <div className="space-y-6">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5">
                <h3 className="text-base font-semibold text-white">Widget Configuration</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">Business Name</p>
                    <p className="text-sm font-medium text-white">{config.business_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Theme</p>
                    <p className="text-sm font-medium text-white capitalize">{config.theme}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-slate-500">Welcome Message</p>
                  <p className="text-sm text-white">{config.welcome_message}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Embed Script</Label>
                <div className="relative">
                  <pre className="rounded-[1rem] border border-white/10 bg-slate-950 p-4 text-sm text-slate-300 overflow-x-auto">
                    <code>{embedScript}</code>
                  </pre>
                  <Button
                    variant="secondary"
                    className="absolute top-3 right-3"
                    onClick={() => copyToClipboard(embedScript)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-slate-400">
                  Add this script tag to the &lt;head&gt; or &lt;body&gt; of your website. The widget will appear as a floating chat button.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open(previewUrl, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Preview Page
                </Button>
              </div>

              {showPreview && (
                <div className="space-y-3">
                  <Label>Live Preview</Label>
                  <div className="h-96 rounded-[1rem] border border-white/10 bg-white">
                    <iframe
                      src={previewUrl}
                      className="h-full w-full rounded-[1rem]"
                      title="Widget Preview"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}