'use client';

import Link from 'next/link';
import { Eye, Heart, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/format';
import { SafeImage } from '@/components/ui/safe-image';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  currencySymbol?: string;
}

export function ProductCard({ product, currencySymbol = '$' }: ProductCardProps) {
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const wishlist = useStore((s) => s.wishlist);
  const setQuickViewProduct = useStore((s) => s.setQuickViewProduct);

  const wishlisted = wishlist.some((w) => w.productId === product.id);
  const outOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(product, 1);
    toast.success(`${product.name} added to bag`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product);
    toast(added ? `${product.name} saved to wishlist` : `Removed from wishlist`);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col rounded-theme-card border border-line-subtle bg-surface-card overflow-hidden transition-colors hover:border-accent-primary/50 shadow-theme-card"
    >
      <Link href={`/products/${product.slug}`} className="relative aspect-[4/3] w-full overflow-hidden bg-surface-secondary">
        <SafeImage
          src={product.images[0] || '/images/hero-flagship.jpg'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-theme-control border backdrop-blur-md transition-colors cursor-pointer',
              wishlisted
                ? 'border-accent-primary bg-accent-primary/20 text-accent-primary'
                : 'border-white/25 bg-black/65 text-white hover:border-accent-primary'
            )}
          >
            <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
          </button>
          <button
            type="button"
            onClick={handleQuickView}
            aria-label="Quick view product"
            className="flex h-9 w-9 items-center justify-center rounded-theme-control border border-white/25 bg-black/65 text-white backdrop-blur-md hover:border-accent-primary transition-colors cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-ink-secondary">
          <span className="truncate">
            {product.brandName || 'SONIQ'}
            {product.categoryName ? ` · ${product.categoryName}` : ''}
          </span>
          {product.ratingAverage > 0 && (
            <span className="inline-flex items-center gap-1 shrink-0 tabular-nums text-ink-primary">
              <Star className="h-3.5 w-3.5 fill-accent-primary text-accent-primary" />
              {product.ratingAverage.toFixed(1)}
            </span>
          )}
        </div>

        <Link href={`/products/${product.slug}`} className="mt-2 block">
          <h3 className="font-display text-base font-semibold text-ink-primary leading-snug line-clamp-1 group-hover:text-accent-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1.5 text-xs text-ink-secondary line-clamp-2 leading-relaxed">
          {product.shortDescription || product.description}
        </p>

        <div className="mt-auto pt-4 flex items-end justify-between gap-3 border-t border-line-subtle">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-ink-primary tabular-nums">
                {formatCurrency(product.price, currencySymbol)}
              </span>
              {product.previousPrice && product.previousPrice > product.price && (
                <span className="text-xs text-ink-secondary line-through tabular-nums">
                  {formatCurrency(product.previousPrice, currencySymbol)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] tabular-nums text-ink-secondary">
              {outOfStock ? (
                <span className="text-red-500 dark:text-red-400">Out of stock</span>
              ) : product.discountPercentage > 0 ? (
                <span className="text-accent-primary">Save {product.discountPercentage}% · In stock</span>
              ) : (
                <span>In stock ({product.stock})</span>
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={handleAddToCart}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-theme-control px-3.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer',
              outOfStock
                ? 'bg-surface-elevated text-ink-secondary/50 cursor-not-allowed'
                : 'bg-btn-primary text-btn-contrast hover:opacity-90'
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {outOfStock ? 'Unavailable' : 'Add'}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
