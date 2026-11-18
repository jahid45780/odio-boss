import { buildPageMetadata, getPageContentSafe, getWebsiteSettingsSafe } from '@/lib/cms-server';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return buildPageMetadata('privacy-policy');
}

export default function PrivacyPolicyPage() {
  const settings = getWebsiteSettingsSafe();
  const page = getPageContentSafe('privacy-policy');

  return (
    <StorefrontShell initialSettings={settings}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 space-y-6 text-sm text-ink-secondary leading-relaxed">
        {page.eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-primary">
            {page.eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink-primary">
          {page.title}
        </h1>
        {page.subtitle && <p className="text-base text-ink-secondary">{page.subtitle}</p>}
        {page.sections.map((sec, idx) => (
          <section key={`${sec.heading}-${idx}`} className="pt-4 space-y-2">
            <h2 className="font-display text-xl font-semibold text-ink-primary">{sec.heading}</h2>
            <p className="whitespace-pre-line">{sec.body}</p>
          </section>
        ))}
      </div>
    </StorefrontShell>
  );
}
