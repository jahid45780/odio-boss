'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SafeImage } from '@/components/ui/safe-image';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/format';
import type { WebsiteSettings } from '@/lib/types';

export function QuickViewModal({ settings }: { settings?: WebsiteSettings }) {
  const product = useStore((s) => s.quickViewProduct);
  const setQuickViewProduct = useStore((s) => s.setQuickViewProduct);
  const addToCart = useStore((s) => s.addToCart);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const symbol = settings?.currencySymbol || '$';

  if (!product) return null;

  const images = product.images.length > 0 ? product.images : ['/images/hero-flagship.jpg'];
  const currentImg = images[selectedImage] || images[0];

  return (
    <Dialog
      open={Boolean(product)}
      onOpenChange={(open) => {
        if (!open) {
          setQuickViewProduct(null);
          setQty(1);
          setSelectedImage(0);
        }
      }}
    >
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-surface-secondary p-5 flex flex-col gap-3">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-theme-control bg-surface-elevated">
              <SafeImage src={currentImg} alt={product.name} fill className="object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, idx) => (
                  <button
                    key={img + idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-14 w-16 overflow-hidden rounded-theme-control border transition-colors cursor-pointer ${
                      idx === selectedImage
                        ? 'border-accent-primary'
                        : 'border-line-subtle opacity-70 hover:opacity-100'
                    }`}
                  >
                    <SafeImage src={img} alt={`${product.name} view ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col">
            <DialogHeader>
              <p className="text-xs text-accent-primary font-medium">
                {product.brandName || 'SONIQ'} · {product.sku}
              </p>
              <DialogTitle className="mt-1 text-2xl">{product.name}</DialogTitle>
            </DialogHeader>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-2xl font-bold text-ink-primary tabular-nums">
                {formatCurrency(product.price, symbol)}
              </span>
              {product.previousPrice && product.previousPrice > product.price && (
                <span className="text-sm text-ink-secondary line-through tabular-nums">
                  {formatCurrency(product.previousPrice, symbol)}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-ink-secondary leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            {product.specs.length > 0 && (
              <div className="mt-4 border-t border-line-subtle pt-4 space-y-2">
                {product.specs.slice(0, 3).map((spec) => (
                  <div key={spec.label} className="flex justify-between gap-4 text-xs">
                    <span className="text-ink-secondary">{spec.label}</span>
                    <span className="text-ink-primary font-medium text-right tabular-nums">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-auto pt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 items-center rounded-theme-control border border-line-strong bg-surface-primary">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3 text-ink-secondary hover:text-ink-primary cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-3 text-sm font-semibold text-ink-primary tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(Math.max(1, product.stock), q + 1))}
                    className="px-3 text-ink-secondary hover:text-ink-primary cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Button
                  className="flex-1"
                  disabled={product.stock <= 0}
                  onClick={() => {
                    addToCart(product, qty);
                    toast.success(`${product.name} added to bag`);
                    setQuickViewProduct(null);
                  }}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {product.stock <= 0 ? 'Out of Stock' : 'Add to Bag'}
                </Button>
              </div>

              <Link
                href={`/products/${product.slug}`}
                onClick={() => setQuickViewProduct(null)}
                className="flex items-center justify-center gap-2 text-xs font-medium text-ink-secondary hover:text-ink-primary py-2 transition-colors"
              >
                View Full Specifications
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
