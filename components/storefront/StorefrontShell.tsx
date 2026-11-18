'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { WebsiteSettings } from '@/lib/types';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { QuickViewModal } from './QuickViewModal';
import { SearchModal } from './SearchModal';

export function StorefrontShell({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: WebsiteSettings;
}) {
  const { data: settings } = useQuery({
    queryKey: ['website-settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data.settings as WebsiteSettings;
    },
    initialData: initialSettings,
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface-primary text-ink-primary transition-colors">
      <Navbar settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <CartDrawer settings={settings} />
      <QuickViewModal settings={settings} />
      <SearchModal settings={settings} />
    </div>
  );
}
