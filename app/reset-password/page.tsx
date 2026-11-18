'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword });
      toast.success(res.data.data.message);
      router.push('/login');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-theme-card border border-line-subtle bg-surface-card p-8 space-y-6 shadow-theme-card">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-primary">
            Security Update
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink-primary">Reset Password</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">Reset Token</label>
            <Input required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste reset token" />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">New Password (min 8 chars)</label>
            <Input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
        <p className="text-center text-xs text-ink-secondary">
          <Link href="/login" className="hover:text-ink-primary transition-colors">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <StorefrontShell>
      <Suspense fallback={<div className="py-20 text-center text-ink-secondary">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </StorefrontShell>
  );
}
