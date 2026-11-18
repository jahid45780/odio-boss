'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product, Review } from '@/lib/types';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { SafeImage } from '@/components/ui/safe-image';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { ProductCard } from './ProductCard';

interface ProductDetailClientProps {
  product: Product;
  reviews: Review[];
  related: Product[];
  currencySymbol?: string;
}

export function ProductDetailClient({
  product,
  reviews: initialReviews,
  related,
  currencySymbol = '$',
}: ProductDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  const [reviewForm, setReviewForm] = useState({
    authorName: '',
    rating: 5,
    title: '',
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const wishlist = useStore((s) => s.wishlist);

  const wishlisted = wishlist.some((w) => w.productId === product.id);
  const images = product.images.length > 0 ? product.images : ['/images/hero-flagship.jpg'];
  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(product, qty);
    toast.success(`${product.name} added to bag`);
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    addToCart(product, qty);
    router.push('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await api.post('/reviews', {
        productId: product.id,
        ...reviewForm,
      });
      toast.success(res.data.data.message || 'Review submitted for moderation.');
      setReviewForm({ authorName: '', rating: 5, title: '', comment: '' });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      if (res.data.data.review?.status === 'APPROVED') {
        setReviews((prev) => [res.data.data.review, ...prev]);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-ink-secondary">
        <Link href="/" className="hover:text-ink-primary transition-colors">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop" className="hover:text-ink-primary transition-colors">
          Shop
        </Link>
        {product.categoryName && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-ink-primary transition-colors">
              {product.categoryName}
            </Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="text-ink-primary truncate">{product.name}</span>
      </nav>

      {/* Main Split: Interactive Gallery + Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-theme-card border border-line-subtle bg-surface-secondary shadow-theme-card">
            <SafeImage
              src={images[selectedImage] || images[0]}
              alt={product.name}
              fill
              priority
              className="object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <button
                  key={img + idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-[4/3] overflow-hidden rounded-theme-control border transition-all cursor-pointer ${
                    idx === selectedImage
                      ? 'border-accent-primary ring-1 ring-accent-primary'
                      : 'border-line-subtle opacity-70 hover:opacity-100'
                  }`}
                >
                  <SafeImage src={img} alt={`${product.name} gallery ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contiguous Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 rounded-theme-card border border-line-subtle bg-surface-card p-6 sm:p-8 space-y-6 shadow-theme-card">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-ink-secondary">
              <span className="text-accent-primary font-medium">
                {product.brandName || 'SONIQ'} · {product.categoryName || 'Audio'}
              </span>
              <span className="font-mono">SKU {product.sku}</span>
            </div>

            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink-primary leading-tight">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-3 text-xs text-ink-secondary">
              <span className="inline-flex items-center gap-1 text-ink-primary tabular-nums">
                <Star className="h-4 w-4 fill-accent-primary text-accent-primary" />
                {product.ratingAverage > 0 ? product.ratingAverage.toFixed(1) : 'New'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{product.ratingCount} verified reviews</span>
              <span aria-hidden="true">·</span>
              <span className={outOfStock ? 'text-red-500 font-medium' : 'text-accent-primary font-medium'}>
                {outOfStock ? 'Out of Stock' : `In Stock (${product.stock} units)`}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-line-subtle flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-ink-primary tabular-nums">
              {formatCurrency(product.price, currencySymbol)}
            </span>
            {product.previousPrice && product.previousPrice > product.price && (
              <>
                <span className="text-base text-ink-secondary line-through tabular-nums">
                  {formatCurrency(product.previousPrice, currencySymbol)}
                </span>
                <span className="text-xs font-semibold text-accent-primary">
                  Save {product.discountPercentage}%
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-ink-secondary leading-relaxed">{product.description}</p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 items-center rounded-theme-control border border-line-strong bg-surface-primary">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1 || outOfStock}
                  aria-label="Decrease quantity"
                  className="px-3.5 text-ink-secondary hover:text-ink-primary disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 text-sm font-semibold text-ink-primary tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  disabled={qty >= product.stock || outOfStock}
                  aria-label="Increase quantity"
                  className="px-3.5 text-ink-secondary hover:text-ink-primary disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button className="flex-1 h-11" disabled={outOfStock} onClick={handleAddToCart}>
                <ShoppingBag className="h-4 w-4" />
                {outOfStock ? 'Out of Stock' : 'Add to Bag'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  const added = toggleWishlist(product);
                  toast(added ? 'Saved to wishlist' : 'Removed from wishlist');
                }}
                aria-label="Toggle wishlist"
                className={`flex h-11 w-11 items-center justify-center rounded-theme-control border transition-colors cursor-pointer ${
                  wishlisted
                    ? 'border-accent-primary bg-accent-primary/15 text-accent-primary'
                    : 'border-line-strong bg-surface-primary text-ink-secondary hover:text-ink-primary'
                }`}
              >
                <Heart className={`h-4.5 w-4.5 ${wishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <Button
              variant="secondary"
              className="w-full h-11"
              disabled={outOfStock}
              onClick={handleBuyNow}
            >
              <Zap className="h-4 w-4 text-accent-primary" />
              Buy Now
            </Button>
          </div>

          <div className="pt-4 border-t border-line-subtle space-y-2.5 text-xs text-ink-secondary">
            <div className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-accent-primary shrink-0" />
              <span>Insured studio courier delivery · 30-day in-room audition</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-accent-primary shrink-0" />
              <span>5-year SONIQ transducer & amplification warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      {product.specs.length > 0 && (
        <section className="mt-16 pt-12 border-t border-line-subtle">
          <h2 className="font-display text-2xl font-semibold text-ink-primary mb-6">
            Technical Specifications
          </h2>
          <div className="rounded-theme-card border border-line-subtle bg-surface-card divide-y divide-line-subtle shadow-theme-card">
            {product.specs.map((spec) => (
              <div
                key={spec.label}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-4 text-sm"
              >
                <span className="text-ink-secondary">{spec.label}</span>
                <span className="sm:col-span-2 font-medium text-ink-primary tabular-nums">{spec.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews */}
      <section className="mt-16 pt-12 border-t border-line-subtle grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-ink-primary">
            Listener Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="rounded-theme-card border border-line-subtle bg-surface-card p-8 text-sm text-ink-secondary">
              No published reviews yet for this model. Share your acoustic impressions on the right.
            </div>
          ) : (
            reviews.map((rev) => (
              <article
                key={rev.id}
                className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-3 shadow-theme-card"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-accent-primary">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs text-ink-secondary">{formatDate(rev.createdAt)}</span>
                </div>
                <h3 className="font-display text-base font-semibold text-ink-primary">{rev.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{rev.comment}</p>
                <div className="flex items-center gap-3 text-xs text-ink-secondary pt-1">
                  <span className="font-medium text-ink-primary">{rev.authorName}</span>
                  {rev.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-accent-primary">
                      <Check className="h-3.5 w-3.5" />
                      Verified Purchase
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="lg:col-span-5">
          <form
            onSubmit={handleReviewSubmit}
            className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card"
          >
            <h3 className="font-display text-lg font-semibold text-ink-primary">Write a Review</h3>
            <div>
              <label className="block text-xs text-ink-secondary mb-1.5">Your Name</label>
              <Input
                required
                value={reviewForm.authorName}
                onChange={(e) => setReviewForm((f) => ({ ...f, authorName: e.target.value }))}
                placeholder="Alex Mercer"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-secondary mb-1.5">Rating</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:outline-none focus:border-accent-primary"
              >
                <option value={5}>5 Stars — Reference Grade</option>
                <option value={4}>4 Stars — Very Good</option>
                <option value={3}>3 Stars — Solid</option>
                <option value={2}>2 Stars — Below Expectations</option>
                <option value={1}>1 Star — Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink-secondary mb-1.5">Headline</label>
              <Input
                required
                value={reviewForm.title}
                onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Remarkable clarity across every register"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-secondary mb-1.5">Review</label>
              <Textarea
                required
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="Describe staging, tonal balance, and build finish..."
              />
            </div>
            <Button type="submit" className="w-full" disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16 pt-12 border-t border-line-subtle">
          <h2 className="font-display text-2xl font-semibold text-ink-primary mb-6">
            Complementary Acoustic Systems
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} currencySymbol={currencySymbol} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
