'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { configureTenant } from '../../lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';

const defaultPricing = JSON.stringify(
  [
    { name: 'Starter', price_monthly: 49, features: ['CRM', 'Appointment scheduling'] },
    { name: 'Pro', price_monthly: 149, features: ['Unlimited leads', 'Analytics'] },
  ],
  null,
  2,
);

const defaultFaqs = JSON.stringify(
  [
    { question: 'Can I change my plan later?', answer: 'Yes, you can upgrade any time.' },
    { question: 'How fast can I launch?', answer: 'Setup takes just a few minutes.' },
  ],
  null,
  2,
);

export default function OnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('friendly');
  const [pricing, setPricing] = useState(defaultPricing);
  const [faqs, setFaqs] = useState(defaultFaqs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = businessName.trim().length > 2 && description.trim().length > 10;

  const parsedPricing = useMemo(() => {
    try {
      return JSON.parse(pricing);
    } catch {
      return null;
    }
  }, [pricing]);

  const parsedFaqs = useMemo(() => {
    try {
      return JSON.parse(faqs);
    } catch {
      return null;
    }
  }, [faqs]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !parsedPricing || !parsedFaqs) {
      setError('Please fix the validation issues before continuing.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const tenantId = businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await configureTenant({
        tenant_id: tenantId,
        business_name: businessName.trim(),
        description: description.trim(),
        tone,
        pricing: parsedPricing,
        faqs: parsedFaqs,
      });

      localStorage.setItem('tenant_id', tenantId);
      localStorage.setItem('tenant_name', businessName.trim());
      router.push('/chat');
    } catch (err) {
      setError((err as Error).message || 'Unable to submit onboarding.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col gap-10">
      <section className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-violet-300">Setup your sales agent</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Keep the onboarding simple and flexible.</h1>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
          Define your business, tone, pricing, and FAQ knowledge so your AI agent feels like your brand.
        </p>
      </section>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Acme Gym Studio"
                autoComplete="organization"
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onChange={(event) => setTone(event.target.value)}>
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="bold">Bold</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe your product or service in 1–2 sentences."
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Pricing (JSON)</Label>
              <Textarea value={pricing} onChange={(event) => setPricing(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>FAQs (JSON)</Label>
              <Textarea value={faqs} onChange={(event) => setFaqs(event.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Use valid JSON arrays for pricing and FAQs. The tenant agent will rely on this knowledge base.
            </p>
            <Button type="submit" disabled={!canSubmit || isLoading || !parsedPricing || !parsedFaqs}>
              {isLoading ? <span className="inline-flex items-center gap-2">Saving... <Spinner /></span> : 'Create Agent'}
            </Button>
          </div>

          {error ? <p className="rounded-[1.5rem] bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
        </form>
      </Card>
    </main>
  );
}
