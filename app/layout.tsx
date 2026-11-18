import type { Metadata } from 'next';
import {
  Outfit,
  Manrope,
  Plus_Jakarta_Sans,
  DM_Sans,
  Urbanist,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { buildPageMetadata, getSafeSiteUrl, getWebsiteSettingsSafe } from '@/lib/cms-server';
import { DEFAULT_THEME_CONFIG } from '@/lib/theme-defaults';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-outfit',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-urbanist',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
});

const siteUrl = getSafeSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const settings = getWebsiteSettingsSafe();
  const baseMeta = buildPageMetadata('global');
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: String(baseMeta.title || `${settings.siteName} — ${settings.tagline}`),
      template: `%s | ${settings.siteName}`,
    },
    description: baseMeta.description,
    keywords: baseMeta.keywords,
    openGraph: {
      ...baseMeta.openGraph,
      siteName: settings.siteName,
      url: siteUrl,
    },
    twitter: baseMeta.twitter,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getWebsiteSettingsSafe();
  const serverTheme = settings.themeConfig || DEFAULT_THEME_CONFIG;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: settings.siteName || 'SONIQ',
    description: settings.footerAbout,
    url: siteUrl,
  };

  // Pre-hydration anti-flash script applying user preference + published/cached theme variables synchronously
  const themeBootstrapScript = `
    (function() {
      try {
        var serverCfg = ${JSON.stringify(serverTheme)};
        var pref = localStorage.getItem('soniq-theme') || serverCfg.defaultTheme || 'dark';
        var resolved = pref;
        if (pref === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (!serverCfg.enableDarkTheme && serverCfg.enableLightTheme) resolved = 'light';
        if (!serverCfg.enableLightTheme && serverCfg.enableDarkTheme) resolved = 'dark';
        var root = document.documentElement;
        if (resolved === 'dark') {
          root.classList.add('dark');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.remove('dark');
          root.style.colorScheme = 'light';
        }
        var pal = resolved === 'dark' ? serverCfg.darkPalette : serverCfg.lightPalette;
        if (pal) {
          root.style.setProperty('--bg-primary', pal.background);
          root.style.setProperty('--bg-secondary', pal.secondaryBackground);
          root.style.setProperty('--bg-card', pal.cardBackground);
          root.style.setProperty('--bg-elevated', pal.elevatedBackground);
          root.style.setProperty('--text-primary', pal.textPrimary);
          root.style.setProperty('--text-secondary', pal.textSecondary);
          root.style.setProperty('--accent-primary', pal.accentPrimary);
          root.style.setProperty('--accent-secondary', pal.accentSecondary);
          root.style.setProperty('--accent-contrast', pal.buttonText);
          root.style.setProperty('--btn-bg', pal.buttonBg);
          root.style.setProperty('--btn-text', pal.buttonText);
          root.style.setProperty('--border-subtle', pal.border);
        }
      } catch (e) {}
    })();
  `;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${outfit.variable} ${manrope.variable} ${plusJakarta.variable} ${dmSans.variable} ${urbanist.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-surface-primary text-ink-primary antialiased selection:bg-accent-primary/25 selection:text-ink-primary"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers initialThemeConfig={serverTheme}>{children}</Providers>
      </body>
    </html>
  );
}
