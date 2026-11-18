'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      queryClient.setQueryData(['auth-me'], res.data.data.user);
      toast.success('Welcome to SONIQ');
      router.push('/account');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-theme-card border border-line-subtle bg-surface-card p-8 space-y-6 shadow-theme-card">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-primary">
              Membership
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink-primary">Create Account</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              Track shipments, manage calibration addresses, and store favorites.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-ink-secondary mb-1.5">Full Name</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Elena Rostova"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-secondary mb-1.5">Email Address</label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="elena@studio.com"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-secondary mb-1.5">Phone (Optional)</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (415) 555-0144"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-secondary mb-1.5">Password (min 8 chars)</label>
              <Input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-xs text-ink-secondary pt-2 border-t border-line-subtle">
            Already registered?{' '}
            <Link href="/login" className="text-accent-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </StorefrontShell>
  );
}
