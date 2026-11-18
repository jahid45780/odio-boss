import { buildPageMetadata, getPageContentSafe, getWebsiteSettingsSafe } from '@/lib/cms-server';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return buildPageMetadata('faq');
}

export default function FaqPage() {
  const settings = getWebsiteSettingsSafe();
  const page = getPageContentSafe('faq');

  return (
    <StorefrontShell initialSettings={settings}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 space-y-8">
        <div>
          {page.eyebrow && (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-primary">
              {page.eyebrow}
            </p>
          )}
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink-primary">{page.title}</h1>
          {page.subtitle && (
            <p className="mt-3 text-base text-ink-secondary leading-relaxed">{page.subtitle}</p>
          )}
        </div>

        <div className="space-y-4">
          {page.faqItems.map((item, idx) => (
            <div
              key={`${item.question}-${idx}`}
              className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-2 shadow-theme-card"
            >
              <h2 className="font-display text-lg font-semibold text-ink-primary">{item.question}</h2>
              <p className="text-sm text-ink-secondary leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </StorefrontShell>
  );
}
