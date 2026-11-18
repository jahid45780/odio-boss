import Link from 'next/link';
import { buildPageMetadata, getPageContentSafe, getWebsiteSettingsSafe } from '@/lib/cms-server';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { SafeImage } from '@/components/ui/safe-image';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return buildPageMetadata('about');
}

export default function AboutPage() {
  const settings = getWebsiteSettingsSafe();
  const page = getPageContentSafe('about');

  return (
    <StorefrontShell initialSettings={settings}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            {page.eyebrow && (
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-primary">
                {page.eyebrow}
              </p>
            )}
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-primary leading-tight">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="text-base text-ink-secondary leading-relaxed">{page.subtitle}</p>
            )}
            <Button asChild>
              <Link href="/shop">Explore Our Speakers</Link>
            </Button>
          </div>
          <div className="lg:col-span-6 relative aspect-[4/3] overflow-hidden rounded-theme-card border border-line-subtle bg-surface-secondary shadow-theme-card">
            <SafeImage
              src={page.heroImageUrl || '/images/studio-monitor.jpg'}
              alt={page.title}
              fill
              className="object-cover"
            />
          </div>
        </section>

        {page.sections.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-line-subtle pt-12">
            {page.sections.map((sec, idx) => (
              <div
                key={`${sec.heading}-${idx}`}
                className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-2 shadow-theme-card"
              >
                <h2 className="font-display text-xl font-semibold text-ink-primary">{sec.heading}</h2>
                <p className="text-sm text-ink-secondary leading-relaxed">{sec.body}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </StorefrontShell>
  );
}
