'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import type { PageContent, WebsiteSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';

interface ContactClientProps {
  initialSettings: WebsiteSettings;
  initialPage: PageContent;
}

export function ContactClient({ initialSettings, initialPage }: ContactClientProps) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['website-settings'],
    queryFn: async () => (await api.get('/settings')).data.data.settings as WebsiteSettings,
    initialData: initialSettings,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/contact', form);
      toast.success(res.data.data.message);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mb-12">
        {initialPage.eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-primary">
            {initialPage.eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink-primary">
          {initialPage.title}
        </h1>
        {initialPage.subtitle && (
          <p className="mt-3 text-base text-ink-secondary">{initialPage.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-5 shadow-theme-card">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-ink-secondary">Direct Concierge Email</p>
                <p className="text-sm font-medium text-ink-primary mt-0.5">
                  {settings?.contactEmail || 'concierge@soniq-audio.com'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-ink-secondary">Studio Advisory Line</p>
                <p className="text-sm font-medium text-ink-primary mt-0.5">
                  {settings?.contactPhone || '+1 (415) 890-4420'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-ink-secondary">Flagship Listening Sanctuary</p>
                <p className="text-sm font-medium text-ink-primary mt-0.5">
                  {settings?.address || '740 Harrison Acoustic Way, San Francisco, CA 94107'}
                </p>
              </div>
            </div>
          </div>

          {initialPage.sections.length > 0 && (
            <div className="space-y-4">
              {initialPage.sections.map((sec, idx) => (
                <div
                  key={`${sec.heading}-${idx}`}
                  className="rounded-theme-card border border-line-subtle bg-surface-card p-5 space-y-1.5"
                >
                  <h2 className="font-display text-sm font-semibold text-ink-primary">{sec.heading}</h2>
                  <p className="text-xs text-ink-secondary leading-relaxed">{sec.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 rounded-theme-card border border-line-subtle bg-surface-card p-6 sm:p-8 space-y-4 shadow-theme-card"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-ink-secondary mb-1.5">Full Name</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Devon Mercer"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-secondary mb-1.5">Email</label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="devon@studio.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">Subject</label>
            <Input
              required
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Room calibration inquiry for Monolith X1"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">Message</label>
            <Textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Share room dimensions or technical questions..."
            />
          </div>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </div>
    </div>
  );
}
