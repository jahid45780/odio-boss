'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Globe,
  Image as ImageIcon,
  Layout,
  Menu,
  Palette,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { WebsiteSettings } from '@/lib/types';
import { AppearanceThemePanel } from './AppearanceThemePanel';
import {
  FooterGeneralCmsPanel,
  HomepageCmsPanel,
  MediaManagerPanel,
  NavigationCmsPanel,
  SeoManagerPanel,
  StaticPagesCmsPanel,
} from './CmsPanels';

type SettingsSectionId =
  | 'appearance'
  | 'homepage'
  | 'navigation'
  | 'footer'
  | 'pages'
  | 'seo'
  | 'media';

const SETTINGS_TABS: Array<{ id: SettingsSectionId; label: string; icon: typeof Palette }> = [
  { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
  { id: 'homepage', label: 'Homepage CMS', icon: Layout },
  { id: 'navigation', label: 'Navigation & Header', icon: Menu },
  { id: 'footer', label: 'Footer & Store', icon: SlidersHorizontal },
  { id: 'pages', label: 'Static Pages', icon: FileText },
  { id: 'seo', label: 'SEO Metadata', icon: Globe },
  { id: 'media', label: 'Media Library', icon: ImageIcon },
];

export function SettingsPanel() {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<SettingsSectionId>('appearance');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['website-settings'],
    queryFn: async () => (await api.get('/settings')).data.data.settings as WebsiteSettings,
  });

  if (isLoading || !settings) {
    return <div className="text-sm text-ink-secondary">Loading website settings...</div>;
  }

  const handleSaved = (next: WebsiteSettings) => {
    queryClient.setQueryData(['website-settings'], next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-line-subtle pb-4">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-theme-control px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-btn-primary text-btn-contrast font-semibold'
                : 'border border-line-subtle bg-surface-card text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'appearance' && <AppearanceThemePanel settings={settings} />}
      {activeSubTab === 'homepage' && <HomepageCmsPanel settings={settings} onSaved={handleSaved} />}
      {activeSubTab === 'navigation' && <NavigationCmsPanel settings={settings} onSaved={handleSaved} />}
      {activeSubTab === 'footer' && <FooterGeneralCmsPanel settings={settings} onSaved={handleSaved} />}
      {activeSubTab === 'pages' && <StaticPagesCmsPanel />}
      {activeSubTab === 'seo' && <SeoManagerPanel />}
      {activeSubTab === 'media' && <MediaManagerPanel />}
    </div>
  );
}
