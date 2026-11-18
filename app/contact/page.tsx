import { buildPageMetadata, getPageContentSafe, getWebsiteSettingsSafe } from '@/lib/cms-server';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { ContactClient } from '@/components/storefront/ContactClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return buildPageMetadata('contact');
}

export default function ContactPage() {
  const settings = getWebsiteSettingsSafe();
  const page = getPageContentSafe('contact');

  return (
    <StorefrontShell initialSettings={settings}>
      <ContactClient initialSettings={settings} initialPage={page} />
    </StorefrontShell>
  );
}
