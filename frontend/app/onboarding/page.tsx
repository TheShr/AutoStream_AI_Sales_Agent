'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { configureTenant } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';

type PricingItem = {
  plan: string;
  price: string;
  features: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const tones = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'bold', label: 'Bold' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('friendly');
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([
    { plan: '', price: '', features: '' },
  ]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([{ question: '', answer: '' }]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStepOneValid = businessName.trim().length > 2 && description.trim().length > 10;
  const isStepTwoValid = faqItems.every((item) => item.question.trim() && item.answer.trim());
  const isStepThreeValid = pricingItems.every((item) => item.plan.trim() && item.price.trim());

  const nextStep = () => setCurrentStep((current) => Math.min(current + 1, 3));
  const prevStep = () => setCurrentStep((current) => Math.max(current - 1, 0));

  const pricingPayload = useMemo(
    () =>
      pricingItems.map((item) => ({
        plan: item.plan.trim(),
        price: item.price.trim(),
        features: item.features.split(',').map((feature) => feature.trim()).filter(Boolean),
      })),
    [pricingItems],
  );

  const faqPayload = useMemo(
    () => faqItems.map((item) => ({ question: item.question.trim(), answer: item.answer.trim() })),
    [faqItems],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isStepOneValid || !isStepTwoValid || !isStepThreeValid) {
      setError('Please complete all sections before submitting.');
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
        pricing: pricingPayload,
        faqs: faqPayload,
      });
      localStorage.setItem('tenant_id', tenantId);
      localStorage.setItem('tenant_name', businessName.trim());
      router.push('/chat');
    } catch (err) {
      setError((err as Error).message || 'Unable to submit onboarding.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col gap-10">
      <section className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-violet-300">Setup your sales agent</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">A premium onboarding flow for your AI agent.</h1>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
          Walk through business setup, FAQs, pricing, and tone so your agent communicates confidently.
        </p>
      </section>

      <section className="space-y-8 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-4">
          {['Business', 'FAQs', 'Pricing', 'Tone'].map((label, index) => (
            <div key={label} className={`rounded-[1.75rem] border p-4 text-center transition ${currentStep === index ? 'border-violet-400/40 bg-slate-950/80 text-white' : 'border-white/10 bg-slate-950/60 text-slate-400'}`}>
              <p className="text-xs uppercase tracking-[0.28em]">Step {index + 1}</p>
              <p className="mt-3 text-sm font-semibold">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-8">
            {currentStep === 0 ? (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Business name</Label>
                    <Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Acme Fitness Studio" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select value={tone} onChange={(event) => setTone(event.target.value)}>
                      {tones.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Business description</Label>
                  <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe what your business does and what makes it unique." />
                </div>
              </div>
            ) : currentStep === 1 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-white">Knowledge base</p>
                    <p className="text-sm text-slate-400">Add common questions your AI agent should answer.</p>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => setFaqItems((current) => [...current, { question: '', answer: '' }])}>
                    <Plus className="h-4 w-4" />
                    Add FAQ
                  </Button>
                </div>
                <div className="space-y-4">
                  {faqItems.map((faq, index) => (
                    <div key={`faq-${index}`} className="space-y-3 rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">FAQ {index + 1}</p>
                        {faqItems.length > 1 ? (
                          <button type="button" onClick={() => setFaqItems((current) => current.filter((_, idx) => idx !== index))} className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/15">
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Question</Label>
                          <Input value={faq.question} onChange={(event) => setFaqItems((current) => current.map((item, idx) => (idx === index ? { ...item, question: event.target.value } : item)))} placeholder="What is your refund policy?" />
                        </div>
                        <div className="space-y-2">
                          <Label>Answer</Label>
                          <Textarea value={faq.answer} onChange={(event) => setFaqItems((current) => current.map((item, idx) => (idx === index ? { ...item, answer: event.target.value } : item)))} placeholder="We offer a 30-day money-back guarantee." />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : currentStep === 2 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-white">Pricing tiers</p>
                    <p className="text-sm text-slate-400">Add one or more plans for your product or service.</p>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => setPricingItems((current) => [...current, { plan: '', price: '', features: '' }])}>
                    <Plus className="h-4 w-4" />
                    Add plan
                  </Button>
                </div>
                <div className="space-y-4">
                  {pricingItems.map((item, index) => (
                    <div key={`pricing-${index}`} className="space-y-4 rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">Plan {index + 1}</p>
                        {pricingItems.length > 1 ? (
                          <button type="button" onClick={() => setPricingItems((current) => current.filter((_, idx) => idx !== index))} className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/15">
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-4 lg:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Plan</Label>
                          <Input value={item.plan} onChange={(event) => setPricingItems((current) => current.map((plan, idx) => (idx === index ? { ...plan, plan: event.target.value } : plan)))} placeholder="Starter" />
                        </div>
                        <div className="space-y-2">
                          <Label>Price</Label>
                          <Input value={item.price} onChange={(event) => setPricingItems((current) => current.map((plan, idx) => (idx === index ? { ...plan, price: event.target.value } : plan)))} placeholder="$99 / month" />
                        </div>
                        <div className="space-y-2">
                          <Label>Features</Label>
                          <Input value={item.features} onChange={(event) => setPricingItems((current) => current.map((plan, idx) => (idx === index ? { ...plan, features: event.target.value } : plan)))} placeholder="CRM, analytics, support" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-6">
                  <p className="text-base font-semibold text-white">Final review</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Review all fields and submit to create your tenant agent. The AI will use this configuration for chat responses.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Business</p>
                    <p className="mt-3 text-base font-medium text-white">{businessName || 'No name provided'}</p>
                    <p className="mt-2 text-sm text-slate-400">{description || 'No description provided.'}</p>
                  </div>
                  <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Tone</p>
                    <p className="mt-3 text-base font-medium text-white">{tones.find((item) => item.value === tone)?.label}</p>
                    <p className="mt-2 text-sm text-slate-400">Your AI agent will communicate in this style.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-3">
                {currentStep > 0 ? (
                  <Button type="button" variant="secondary" onClick={prevStep}>
                    Back
                  </Button>
                ) : null}
                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep} disabled={currentStep === 0 ? !isStepOneValid : currentStep === 1 ? !isStepTwoValid : !isStepThreeValid}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              {currentStep === 3 ? (
                <Button type="submit" disabled={isLoading || !isStepOneValid || !isStepTwoValid || !isStepThreeValid}>
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">Saving... <Spinner /></span>
                  ) : (
                    'Create agent'
                  )}
                </Button>
              ) : null}
            </div>

            {error ? <p className="rounded-[1.5rem] bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          </form>
        </Card>
      </section>
    </main>
  );
}
