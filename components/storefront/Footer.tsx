import Link from 'next/link';
import type { WebsiteSettings } from '@/lib/types';
import { DEFAULT_FOOTER_CONFIG } from '@/lib/cms-defaults';
import { SafeImage } from '@/components/ui/safe-image';

interface FooterProps {
  settings?: WebsiteSettings;
}

export function Footer({ settings }: FooterProps) {
  const siteName = settings?.siteName || 'SONIQ';
  const year = new Date().getFullYear();
  const footerCfg = settings?.footerConfig || DEFAULT_FOOTER_CONFIG;
  const columns = footerCfg.columns?.length ? footerCfg.columns : DEFAULT_FOOTER_CONFIG.columns;

  const copyright = (footerCfg.copyrightText || '© {year} {siteName}. All rights reserved.')
    .replace('{year}', String(year))
    .replace('{siteName}', siteName);

  return (
    <footer className="border-t border-line-subtle bg-surface-primary text-ink-secondary transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-[0.18em] text-ink-primary">
              {settings?.logoUrl ? (
                <span className="relative h-8 w-28 overflow-hidden block">
                  <SafeImage src={settings.logoUrl} alt={siteName} fill className="object-contain object-left" />
                </span>
              ) : (
                siteName
              )}
            </Link>
            <p className="text-sm leading-relaxed text-ink-secondary">
              {settings?.footerAbout ||
                'Engineered in San Francisco and Munich, SONIQ crafts reference-grade loudspeaker architecture for studios and listening sanctuaries.'}
            </p>
            <div className="text-xs space-y-1 pt-1">
              <p>{settings?.contactEmail || 'concierge@soniq-audio.com'}</p>
              <p>{settings?.contactPhone || '+1 (415) 890-4420'}</p>
              <p>{settings?.address || '740 Harrison Acoustic Way, San Francisco, CA'}</p>
            </div>
          </div>

          {columns.slice(0, 3).map((col) => (
            <div key={col.id || col.title}>
              <h3 className="text-sm font-semibold text-ink-primary mb-4">{col.title}</h3>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((item) => (
                  <li key={`${col.id}-${item.href}-${item.label}`}>
                    <Link href={item.href} className="hover:text-ink-primary transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-line-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-secondary">
          <p>{copyright}</p>
          <div className="flex items-center gap-6">
            {settings?.socialLinks?.instagram && (
              <a href={settings.socialLinks.instagram} target="_blank" rel="noreferrer" className="hover:text-ink-primary transition-colors">
                Instagram
              </a>
            )}
            {settings?.socialLinks?.youtube && (
              <a href={settings.socialLinks.youtube} target="_blank" rel="noreferrer" className="hover:text-ink-primary transition-colors">
                YouTube
              </a>
            )}
            {settings?.socialLinks?.x && (
              <a href={settings.socialLinks.x} target="_blank" rel="noreferrer" className="hover:text-ink-primary transition-colors">
                X
              </a>
            )}
            {settings?.socialLinks?.linkedin && (
              <a href={settings.socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:text-ink-primary transition-colors">
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
