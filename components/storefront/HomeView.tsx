'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HeroSection } from '@/components/home/HeroSection';
import {
  ArrowRight,
  Sliders,
  ShieldCheck,
  Waves,
  Speaker,
  Star,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { DEFAULT_FOOTER_CONFIG, DEFAULT_HOMEPAGE_CONFIG } from '@/lib/cms-defaults';
import type {
  Banner,
  Brand,
  Category,
  HomepageSectionConfig,
  HomepageSectionKey,
  Product,
  Review,
  WebsiteSettings,
} from '@/lib/types';
import { ProductCard } from './ProductCard';
import { SafeImage } from '@/components/ui/safe-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface StorefrontPayload {
  settings: WebsiteSettings;
  featured: Product[];
  bestSellers: Product[];
  newArrivals: Product[];
  categories: Category[];
  brands: Brand[];
  banners: Banner[];
  reviews: Review[];
}

export function HomeView({ initialData }: { initialData: StorefrontPayload }) {
  const [activeCollection, setActiveCollection] = useState<'featured' | 'bestSellers' | 'newArrivals'>('featured');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  const { data } = useQuery({
    queryKey: ['storefront'],
    queryFn: async () => {
      const res = await api.get('/storefront');
      return res.data.data as StorefrontPayload;
    },
    initialData,
  });

  const { settings, featured, bestSellers, newArrivals, categories, brands, banners, reviews } = data;
  const legacySections = settings.homepageSections || {};
  const hp = settings.homepageConfig || DEFAULT_HOMEPAGE_CONFIG;
  const fc = settings.footerConfig || DEFAULT_FOOTER_CONFIG;
  const symbol = settings.currencySymbol || '$';

  const displayedProducts =
    activeCollection === 'bestSellers'
      ? bestSellers
      : activeCollection === 'newArrivals'
      ? newArrivals
      : featured;

  const primaryBanner = banners[0];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubmittingNewsletter(true);
    try {
      const res = await api.post('/newsletter', { email: newsletterEmail.trim() });
      toast.success(res.data.data.message || 'Subscribed to SONIQ dispatches.');
      setNewsletterEmail('');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  const orderedSections: HomepageSectionConfig[] = (
    hp.sections && hp.sections.length > 0 ? hp.sections : DEFAULT_HOMEPAGE_CONFIG.sections
  )
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const renderSection = (sec: HomepageSectionConfig): ReactNode => {
    if (!sec.isVisible) return null;

    switch (sec.key as HomepageSectionKey) {
      case 'collections': {
        const showFeatured = legacySections.showFeatured !== false;
        const showBest = legacySections.showBestSellers !== false;
        const showNew = legacySections.showNewArrivals !== false;
        if (!showFeatured && !showBest && !showNew) return null;
        return (
          <section key={sec.key} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 section-py">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <p className="text-xs font-medium tracking-[0.18em] uppercase text-accent-primary">
                  {sec.eyebrow}
                </p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-ink-primary">
                  {sec.title}
                </h2>
                {sec.description && (
                  <p className="mt-2 text-sm text-ink-secondary max-w-xl">{sec.description}</p>
                )}
              </div>

              <div className="inline-flex items-center gap-1 rounded-theme-control border border-line-subtle bg-surface-secondary p-1 self-start">
                {showFeatured && (
                  <button
                    type="button"
                    onClick={() => setActiveCollection('featured')}
                    className={`px-4 py-2 rounded-theme-control text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      activeCollection === 'featured'
                        ? 'bg-btn-primary text-btn-contrast font-semibold'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    Featured
                  </button>
                )}
                {showBest && (
                  <button
                    type="button"
                    onClick={() => setActiveCollection('bestSellers')}
                    className={`px-4 py-2 rounded-theme-control text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      activeCollection === 'bestSellers'
                        ? 'bg-btn-primary text-btn-contrast font-semibold'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    Best Selling
                  </button>
                )}
                {showNew && (
                  <button
                    type="button"
                    onClick={() => setActiveCollection('newArrivals')}
                    className={`px-4 py-2 rounded-theme-control text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      activeCollection === 'newArrivals'
                        ? 'bg-btn-primary text-btn-contrast font-semibold'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    New Arrivals
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} currencySymbol={symbol} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Button variant="secondary" size="lg" asChild>
                <Link href="/shop">
                  View Complete Catalog
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        );
      }

      case 'categories': {
        if (legacySections.showCategories === false || categories.length === 0) return null;
        return (
          <section key={sec.key} className="border-y border-line-subtle bg-surface-secondary section-py">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between gap-4 mb-10">
                <div>
                  <p className="text-xs font-medium tracking-[0.18em] uppercase text-accent-primary">
                    {sec.eyebrow}
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold text-ink-primary">
                    {sec.title}
                  </h2>
                  {sec.description && (
                    <p className="mt-2 text-sm text-ink-secondary max-w-xl">{sec.description}</p>
                  )}
                </div>
                <Link href="/shop" className="text-sm font-medium text-accent-primary hover:underline whitespace-nowrap">
                  All Categories
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className="group relative overflow-hidden rounded-theme-card border border-line-subtle bg-surface-card shadow-theme-card transition-colors hover:border-accent-primary/60"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-elevated">
                      <SafeImage
                        src={cat.imageUrl || '/images/hero-flagship.jpg'}
                        alt={cat.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-lg font-semibold text-ink-primary group-hover:text-accent-primary transition-colors">
                          {cat.name}
                        </h3>
                        <span className="text-xs text-ink-secondary tabular-nums">
                          {cat.productCount ?? 0} models
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-ink-secondary line-clamp-2">{cat.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'promoBanner': {
        if (legacySections.showPromoBanner === false || !primaryBanner) return null;
        return (
          <section key={sec.key} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 section-py">
            <div className="relative overflow-hidden rounded-theme-card border border-line-subtle bg-surface-card shadow-theme-card grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center">
                <p className="text-xs font-medium tracking-[0.18em] uppercase text-accent-primary">
                  {sec.eyebrow}
                </p>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-ink-primary text-balance">
                  {primaryBanner.title}
                </h2>
                <p className="mt-4 text-sm sm:text-base text-ink-secondary leading-relaxed">
                  {primaryBanner.subtitle}
                </p>
                <div className="mt-8">
                  <Button size="lg" asChild>
                    <Link href={primaryBanner.ctaLink || '/shop'}>
                      {primaryBanner.ctaText || 'Explore System'}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="lg:col-span-6 relative min-h-[280px] lg:min-h-[380px] bg-surface-elevated">
                <SafeImage
                  src={primaryBanner.imageUrl}
                  alt={primaryBanner.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </section>
        );
      }

      case 'whySoniq': {
        if (legacySections.showWhySoniq === false) return null;
        return (
          <section key={sec.key} id="technology" className="border-t border-line-subtle bg-surface-secondary section-py">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl mb-12">
                <p className="text-xs font-medium tracking-[0.18em] uppercase text-accent-primary">
                  {sec.eyebrow}
                </p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-ink-primary">
                  {sec.title}
                </h2>
                {sec.description && (
                  <p className="mt-3 text-sm sm:text-base text-ink-secondary leading-relaxed">
                    {sec.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: Waves,
                    title: 'Constant-Directivity Waveguide',
                    body: 'Custom-machined horn geometry maintains uniform frequency dispersion across wide seating zones.',
                  },
                  {
                    icon: Sliders,
                    title: '96kHz FIR Room Calibration',
                    body: 'Adaptive boundary compensation filters neutralize low-frequency room modes automatically.',
                  },
                  {
                    icon: Speaker,
                    title: 'Zero-Resonance Chassis',
                    body: 'High-density anodized 6061 aluminum baffles eliminate cabinet coloration even at 118 dB SPL.',
                  },
                  {
                    icon: ShieldCheck,
                    title: '5-Year Acoustic Warranty',
                    body: 'Every SONIQ loudspeaker includes insured courier delivery, concierge setup, and five-year coverage.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-3 shadow-theme-card"
                  >
                    <item.icon className="h-6 w-6 text-accent-primary" />
                    <h3 className="font-display text-lg font-semibold text-ink-primary">{item.title}</h3>
                    <p className="text-sm text-ink-secondary leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'brands': {
        if (legacySections.showBrands === false || brands.length === 0) return null;
        return (
          <section key={sec.key} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-ink-secondary text-center mb-8">
              {sec.eyebrow || sec.title}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/shop?brand=${brand.slug}`}
                  className="flex flex-col items-center justify-center rounded-theme-card border border-line-subtle bg-surface-card p-6 text-center shadow-theme-card hover:border-accent-primary/60 transition-colors"
                >
                  <span className="font-display text-lg font-semibold text-ink-primary">{brand.name}</span>
                  <span className="mt-1 text-xs text-ink-secondary line-clamp-1">{brand.description}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      }

      case 'reviews': {
        if (legacySections.showReviews === false || reviews.length === 0) return null;
        return (
          <section key={sec.key} className="border-t border-line-subtle bg-surface-secondary section-py">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-10">
                <p className="text-xs font-medium tracking-[0.18em] uppercase text-accent-primary">
                  {sec.eyebrow}
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-ink-primary">
                  {sec.title}
                </h2>
                {sec.description && (
                  <p className="mt-2 text-sm text-ink-secondary max-w-xl">{sec.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.slice(0, 3).map((review) => (
                  <article
                    key={review.id}
                    className="flex flex-col rounded-theme-card border border-line-subtle bg-surface-card p-6 shadow-theme-card"
                  >
                    <div className="flex items-center gap-1 text-accent-primary">
                      {Array.from({ length: review.rating }).map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <h3 className="mt-4 font-display text-base font-semibold text-ink-primary">
                      {review.title}
                    </h3>
                    <p className="mt-2 text-sm text-ink-secondary leading-relaxed flex-1">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                    <div className="mt-5 pt-4 border-t border-line-subtle flex items-center justify-between text-xs text-ink-secondary">
                      <span className="font-medium text-ink-primary">{review.authorName}</span>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-accent-primary">
                          <Check className="h-3.5 w-3.5" />
                          Verified Owner
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'newsletter': {
        if (legacySections.showNewsletter === false) return null;
        return (
          <section key={sec.key} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 section-py">
            <div className="rounded-theme-card border border-line-subtle bg-surface-card p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-theme-card">
              <div className="max-w-xl">
                <p className="text-xs font-medium tracking-[0.18em] uppercase text-accent-primary">
                  {fc.newsletterEyebrow || sec.eyebrow}
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-ink-primary">
                  {fc.newsletterTitle || sec.title}
                </h2>
                {fc.newsletterSubtitle && (
                  <p className="mt-2 text-sm text-ink-secondary">{fc.newsletterSubtitle}</p>
                )}
              </div>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[420px]">
                <Input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="h-11 flex-1"
                />
                <Button type="submit" size="lg" disabled={submittingNewsletter}>
                  {submittingNewsletter ? 'Joining...' : fc.newsletterButtonText || 'Subscribe'}
                </Button>
              </form>
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div>
      <HeroSection settings={settings} />

      {/* Dynamic CMS Ordered Sections */}
      {orderedSections.map((sec) => renderSection(sec))}
    </div>
  );
}
