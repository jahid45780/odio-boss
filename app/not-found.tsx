import Link from 'next/link';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <StorefrontShell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-primary">
          404 · Not Found
        </p>
        <h1 className="mt-3 font-display text-3xl sm:text-5xl font-bold text-ink-primary">
          Frequency Not Found
        </h1>
        <p className="mt-4 text-sm sm:text-base text-ink-secondary max-w-md mx-auto leading-relaxed">
          The loudspeaker model or page you requested could not be located in our catalog.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/shop">Explore Collection</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </StorefrontShell>
  );
}
