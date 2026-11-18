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

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      queryClient.setQueryData(['auth-me'], res.data.data.user);
      toast.success('Signed in to SONIQ');
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
              Customer Portal
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink-primary">Sign In to SONIQ</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              Access your orders, saved systems, and delivery addresses.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-ink-secondary mb-1.5">Email Address</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-ink-secondary">Password</label>
                <Link href="/forgot-password" className="text-xs text-accent-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-xs text-ink-secondary pt-2 border-t border-line-subtle">
            New to SONIQ?{' '}
            <Link href="/register" className="text-accent-primary font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </StorefrontShell>
  );
}
