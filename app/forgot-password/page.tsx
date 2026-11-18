'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.data.message);
      if (res.data.data.resetToken) {
        setDevToken(res.data.data.resetToken);
      }
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
              Account Recovery
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink-primary">Forgot Password</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              Enter your registered email address to request a password reset token.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Issuing token...' : 'Request Reset Token'}
            </Button>
          </form>

          {devToken && (
            <div className="rounded-theme-control border border-accent-primary/40 bg-surface-secondary p-4 text-xs space-y-2">
              <p className="text-accent-primary font-semibold">Reset Token Issued (Development Preview):</p>
              <code className="block break-all font-mono text-ink-primary">{devToken}</code>
              <Link
                href={`/reset-password?token=${encodeURIComponent(devToken)}`}
                className="inline-block text-accent-primary hover:underline font-medium"
              >
                Continue to Reset Password →
              </Link>
            </div>
          )}

          <p className="text-center text-xs text-ink-secondary">
            <Link href="/login" className="hover:text-ink-primary transition-colors">
              Return to Sign In
            </Link>
          </p>
        </div>
      </div>
    </StorefrontShell>
  );
}
