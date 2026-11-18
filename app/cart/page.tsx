'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useStore } from '@/store/useStore';
import type { WebsiteSettings } from '@/lib/types';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { SafeImage } from '@/components/ui/safe-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CartPage() {
  const cart = useStore((s) => s.cart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const couponCode = useStore((s) => s.couponCode);
  const setCouponCode = useStore((s) => s.setCouponCode);

  const [codeInput, setCodeInput] = useState(couponCode);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['website-settings'],
    queryFn: async () => (await api.get('/settings')).data.data.settings as WebsiteSettings,
  });

  const symbol = settings?.currencySymbol || '$';
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeThreshold = settings?.freeShippingThreshold ?? 500;
  const baseShipping = settings?.shippingCharge ?? 35;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const shippingFee = cart.length === 0 ? 0 : afterDiscount >= freeThreshold ? 0 : baseShipping;
  const total = afterDiscount + shippingFee;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await api.post('/coupons/validate', {
        code: codeInput.trim(),
        subtotal,
      });
      setDiscountAmount(res.data.data.discountAmount);
      setCouponCode(res.data.data.code);
      toast.success(`Coupon ${res.data.data.code} applied`);
    } catch (err) {
      setDiscountAmount(0);
      setCouponCode('');
      toast.error(getApiErrorMessage(err));
    } finally {
      setValidatingCoupon(false);
    }
  };

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink-primary mb-8">
          Shopping Bag
        </h1>

        {cart.length === 0 ? (
          <div className="rounded-theme-card border border-line-subtle bg-surface-card p-12 text-center shadow-theme-card">
            <ShoppingBag className="mx-auto h-12 w-12 text-ink-secondary/40 mb-4" />
            <h2 className="font-display text-xl font-semibold text-ink-primary">Your bag is currently empty</h2>
            <p className="mt-2 text-sm text-ink-secondary">
              Explore reference loudspeakers, studio monitors, and acoustic accessories.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/shop">Browse Speakers</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row gap-5 rounded-theme-card border border-line-subtle bg-surface-card p-5 shadow-theme-card"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative h-28 w-full sm:w-36 shrink-0 overflow-hidden rounded-theme-control bg-surface-elevated"
                  >
                    <SafeImage src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-accent-primary">{item.brandName} · {item.sku}</p>
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-display text-lg font-semibold text-ink-primary hover:text-accent-primary transition-colors"
                        >
                          {item.name}
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        aria-label={`Remove ${item.name}`}
                        className="text-ink-secondary hover:text-red-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="inline-flex items-center rounded-theme-control border border-line-strong bg-surface-primary">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-sm font-medium text-ink-primary tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="px-3 py-1.5 text-ink-secondary hover:text-ink-primary disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-display text-lg font-semibold text-ink-primary tabular-nums">
                        {formatCurrency(item.price * item.quantity, symbol)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4 rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-6 shadow-theme-card">
              <h2 className="font-display text-xl font-semibold text-ink-primary">Order Summary</h2>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-secondary" />
                  <Input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Coupon (e.g. SONIQ10)"
                    className="pl-9"
                  />
                </div>
                <Button type="submit" variant="secondary" disabled={validatingCoupon}>
                  Apply
                </Button>
              </form>

              <div className="space-y-3 text-sm border-t border-line-subtle pt-4">
                <div className="flex justify-between text-ink-secondary">
                  <span>Subtotal</span>
                  <span className="text-ink-primary tabular-nums">{formatCurrency(subtotal, symbol)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-accent-primary">
                    <span>Discount ({couponCode})</span>
                    <span className="tabular-nums">-{formatCurrency(discountAmount, symbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-secondary">
                  <span>Insured Shipping</span>
                  <span className="text-ink-primary tabular-nums">
                    {shippingFee === 0 ? 'Complimentary' : formatCurrency(shippingFee, symbol)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-line-subtle text-base font-semibold text-ink-primary">
                  <span>Total</span>
                  <span className="font-display text-xl tabular-nums">{formatCurrency(total, symbol)}</span>
                </div>
              </div>

              <Button size="lg" className="w-full" asChild>
                <Link href="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
