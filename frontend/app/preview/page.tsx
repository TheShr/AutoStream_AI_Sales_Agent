'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getWidgetConfig } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

export const dynamic = 'force-dynamic';

function PreviewContent() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenant');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      loadConfig();
    } else {
      setError('No tenant ID provided');
      setLoading(false);
    }
  }, [tenantId]);

  const loadConfig = async () => {
    try {
      const widgetConfig = await getWidgetConfig(tenantId!);
      setConfig(widgetConfig);
    } catch (err) {
      setError('Failed to load widget configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config) {
      // Inject the widget script dynamically for preview
      const script = document.createElement('script');
      script.src = '/widget.js';
      script.setAttribute('data-tenant', config.tenant_id);
      document.head.appendChild(script);

      return () => {
        // Cleanup script on unmount
        const existingScript = document.querySelector('script[src="/widget.js"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [config]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Preview Error</h2>
            <p className="mt-2 text-slate-400">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">Widget Preview</h1>
          <p className="mt-4 text-xl text-slate-300">
            This is a preview of your AI sales agent widget.
          </p>
          <p className="mt-2 text-slate-400">
            Click the chat button in the bottom-right corner to interact with your agent.
          </p>
        </div>

        <div className="mt-16">
          <Card>
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Sample Website Content</h2>
              <div className="space-y-4 text-slate-300">
                <p>
                  Welcome to our sample website! This page demonstrates how your AI sales agent widget
                  will appear on your actual website.
                </p>
                <p>
                  The widget loads automatically and provides a seamless chat experience for your visitors.
                  It maintains conversation context and can capture leads just like on your main dashboard.
                </p>
                <div className="rounded-lg bg-slate-800 p-6">
                  <h3 className="text-lg font-medium text-white">Features</h3>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-slate-300">
                    <li>Real-time chat with your AI agent</li>
                    <li>Automatic lead capture</li>
                    <li>Mobile-responsive design</li>
                    <li>Customizable appearance</li>
                    <li>Session persistence</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* The widget will be injected here */}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}