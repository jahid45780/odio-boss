'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/storefront/ThemeToggle';

export default function AdminLoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: setupStatus, isLoading: checkingSetup } = useQuery({
    queryKey: ['admin-setup-status'],
    queryFn: async () => (await api.get('/auth/setup-admin')).data.data as { adminExists: boolean },
  });

  const adminExists = setupStatus?.adminExists ?? true;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const user = res.data.data.user;
      if (user.role !== 'ADMIN') {
        await api.post('/auth/logout');
        toast.error('This account does not have administrator privileges.');
        return;
      }
      queryClient.setQueryData(['auth-me'], user);
      toast.success('Authenticated to SONIQ Admin Console');
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/setup-admin', { name, email, password });
      queryClient.setQueryData(['auth-me'], res.data.data.user);
      toast.success('Administrator account initialized');
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary text-ink-primary flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-theme-card border border-line-subtle bg-surface-card p-8 space-y-6 shadow-theme-card">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold tracking-[0.18em] text-ink-primary">
            SONIQ
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ShieldCheck className="h-6 w-6 text-accent-primary" />
          </div>
        </div>

        {checkingSetup ? (
          <p className="text-sm text-ink-secondary">Checking console authorization...</p>
        ) : !adminExists ? (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-primary">
                First-Run Initialization
              </p>
              <h1 className="mt-2 font-display text-2xl font-semibold text-ink-primary">
                Create Administrator Account
              </h1>
              <p className="mt-1 text-xs text-ink-secondary leading-relaxed">
                No administrator exists in the database yet. Initialize your primary admin credentials below (locked permanently after creation).
              </p>
            </div>
            <form onSubmit={handleInitialSetup} className="space-y-4">
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Admin Name</label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="SONIQ Administrator" />
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Admin Email</label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@soniq-audio.com" />
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Password (min 8 chars)</label>
                <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Initializing...' : 'Initialize Admin & Enter Console'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-primary">
                Protected Console
              </p>
              <h1 className="mt-2 font-display text-2xl font-semibold text-ink-primary">
                Administrator Sign In
              </h1>
              <p className="mt-1 text-xs text-ink-secondary">
                Authorized SONIQ personnel only.
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Admin Email</label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@soniq-audio.com" />
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Password</label>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In to Dashboard'}
              </Button>
            </form>
          </>
        )}

        <div className="pt-3 border-t border-line-subtle text-center">
          <Link href="/" className="text-xs text-ink-secondary hover:text-ink-primary transition-colors">
            ← Return to SONIQ Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
