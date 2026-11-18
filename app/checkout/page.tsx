'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ShieldCheck, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useStore } from '@/store/useStore';
import type { WebsiteSettings } from '@/lib/types';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { SafeImage } from '@/components/ui/safe-image';

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, 'Full name is required'),
  customerEmail: z.string().trim().email('Valid email is required'),
  customerPhone: z.string().trim().min(5, 'Phone number is required'),
  shippingCountry: z.string().trim().min(2, 'Country is required'),
  shippingCity: z.string().trim().min(2, 'City is required'),
  shippingAddress: z.string().trim().min(5, 'Street address is required'),
  postalCode: z.string().trim().min(2, 'Postal code is required'),
  paymentMethod: z.enum(['COD', 'ONLINE']),
  notes: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useStore((s) => s.cart);
  const couponCode = useStore((s) => s.couponCode);
  const setCouponCode = useStore((s) => s.setCouponCode);
  const clearCart = useStore((s) => s.clearCart);

  const [codeInput, setCodeInput] = useState(couponCode);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [placingOrder, setPlacingOrder] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['website-settings'],
    queryFn: async () => (await api.get('/settings')).data.data.settings as WebsiteSettings,
  });

  const { data: authUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      try {
        return (await api.get('/auth/me')).data.data.user;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      shippingCountry: 'United States',
      shippingCity: '',
      shippingAddress: '',
      postalCode: '',
      paymentMethod: 'COD',
      notes: '',
    },
  });

  useEffect(() => {
    if (authUser) {
      setValue('customerName', authUser.name || '');
      setValue('customerEmail', authUser.email || '');
      setValue('customerPhone', authUser.phone || '');
      const defaultAddr = authUser.addresses?.find((a: { isDefault?: boolean }) => a.isDefault) || authUser.addresses?.[0];
      if (defaultAddr) {
        setValue('shippingCountry', defaultAddr.country);
        setValue('shippingCity', defaultAddr.city);
        setValue('shippingAddress', defaultAddr.address);
        setValue('postalCode', defaultAddr.postalCode);
      }
    }
  }, [authUser, setValue]);

  const symbol = settings?.currencySymbol || '$';
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeThreshold = settings?.freeShippingThreshold ?? 500;
  const baseShipping = settings?.shippingCharge ?? 35;

  useEffect(() => {
    if (couponCode && subtotal > 0) {
      api
        .post('/coupons/validate', { code: couponCode, subtotal })
        .then((res) => setDiscountAmount(res.data.data.discountAmount))
        .catch(() => {
          setDiscountAmount(0);
          setCouponCode('');
        });
    }
  }, [couponCode, subtotal, setCouponCode]);

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const shippingFee = cart.length === 0 ? 0 : afterDiscount >= freeThreshold ? 0 : baseShipping;
  const total = afterDiscount + shippingFee;

  const handleApplyCoupon = async () => {
    if (!codeInput.trim()) return;
    try {
      const res = await api.post('/coupons/validate', { code: codeInput.trim(), subtotal });
      setDiscountAmount(res.data.data.discountAmount);
      setCouponCode(res.data.data.code);
      toast.success(`Coupon ${res.data.data.code} applied`);
    } catch (err) {
      setDiscountAmount(0);
      setCouponCode('');
      toast.error(getApiErrorMessage(err));
    }
  };

  const onSubmit = async (values: CheckoutValues) => {
    if (cart.length === 0) {
      toast.error('Your bag is empty.');
      return;
    }
    setPlacingOrder(true);
    try {
      const res = await api.post('/orders', {
        ...values,
        couponCode: couponCode || '',
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      const orderNumber = res.data.data.order.orderNumber;
      clearCart();
      toast.success('Order confirmed');
      router.push(`/orders/confirmation/${orderNumber}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-line-subtle pb-6">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-accent-primary">
              Secure Checkout
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink-primary">
              Delivery & Payment
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-ink-secondary">
            <Lock className="h-4 w-4 text-accent-primary" />
            Server-verified pricing & stock reservation
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-theme-card border border-line-subtle bg-surface-card p-10 text-center shadow-theme-card">
            <p className="text-ink-primary font-display text-lg">No items in your bag to check out.</p>
            <Button className="mt-5" asChild>
              <Link href="/shop">Return to Shop</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
                <h2 className="font-display text-lg font-semibold text-ink-primary">Customer & Shipping Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-secondary mb-1.5">Full Name</label>
                    <Input {...register('customerName')} placeholder="Marcus Vance" />
                    {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-ink-secondary mb-1.5">Email Address</label>
                    <Input type="email" {...register('customerEmail')} placeholder="marcus@studio.com" />
                    {errors.customerEmail && <p className="text-xs text-red-500 mt-1">{errors.customerEmail.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-ink-secondary mb-1.5">Phone Number</label>
                    <Input {...register('customerPhone')} placeholder="+1 (415) 555-0198" />
                    {errors.customerPhone && <p className="text-xs text-red-500 mt-1">{errors.customerPhone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-ink-secondary mb-1.5">Country</label>
                    <Input {...register('shippingCountry')} placeholder="United States" />
                    {errors.shippingCountry && <p className="text-xs text-red-500 mt-1">{errors.shippingCountry.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-ink-secondary mb-1.5">City</label>
                    <Input {...register('shippingCity')} placeholder="San Francisco" />
                    {errors.shippingCity && <p className="text-xs text-red-500 mt-1">{errors.shippingCity.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-ink-secondary mb-1.5">Postal Code</label>
                    <Input {...register('postalCode')} placeholder="94107" />
                    {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Street Address</label>
                  <Input {...register('shippingAddress')} placeholder="450 Townsend St, Suite 302" />
                  {errors.shippingAddress && <p className="text-xs text-red-500 mt-1">{errors.shippingAddress.message}</p>}
                </div>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Delivery Notes (Optional)</label>
                  <Textarea {...register('notes')} placeholder="Gate code, studio floor, or calibration scheduling preference..." />
                </div>
              </section>

              <section className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
                <h2 className="font-display text-lg font-semibold text-ink-primary">Payment Method</h2>
                <label className="flex items-start gap-3 rounded-theme-control border border-accent-primary/60 bg-surface-secondary p-4 cursor-pointer">
                  <input
                    type="radio"
                    value="COD"
                    {...register('paymentMethod')}
                    className="mt-1 accent-[var(--accent-primary)]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink-primary">Cash on Delivery (COD)</p>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      Pay upon insured white-glove courier arrival and acoustic inspection.
                    </p>
                  </div>
                </label>
                <div className="rounded-theme-control border border-line-subtle bg-surface-secondary/70 p-4 opacity-60">
                  <p className="text-sm font-medium text-ink-primary">Online Card Payment</p>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Available when live Stripe provider keys are configured in server environment variables.
                  </p>
                </div>
              </section>
            </div>

            <aside className="lg:col-span-5 rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-5 shadow-theme-card">
              <h2 className="font-display text-lg font-semibold text-ink-primary">Order Review</h2>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 text-sm">
                    <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-theme-control bg-surface-elevated">
                      <SafeImage src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-primary truncate">{item.name}</p>
                      <p className="text-xs text-ink-secondary tabular-nums">Qty {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-ink-primary tabular-nums">
                      {formatCurrency(item.price * item.quantity, symbol)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-3 border-t border-line-subtle">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-secondary" />
                  <Input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="pl-9"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={handleApplyCoupon}>
                  Apply
                </Button>
              </div>

              <div className="space-y-2.5 text-sm pt-3 border-t border-line-subtle">
                <div className="flex justify-between text-ink-secondary">
                  <span>Subtotal</span>
                  <span className="text-ink-primary tabular-nums">{formatCurrency(subtotal, symbol)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-accent-primary">
                    <span>Coupon ({couponCode})</span>
                    <span className="tabular-nums">-{formatCurrency(discountAmount, symbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-secondary">
                  <span>Shipping</span>
                  <span className="text-ink-primary tabular-nums">
                    {shippingFee === 0 ? 'Complimentary' : formatCurrency(shippingFee, symbol)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-line-subtle text-base font-semibold text-ink-primary">
                  <span>Total Amount</span>
                  <span className="font-display text-xl tabular-nums">{formatCurrency(total, symbol)}</span>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={placingOrder}>
                {placingOrder ? 'Confirming Order...' : `Place Order · ${formatCurrency(total, symbol)}`}
              </Button>

              <p className="flex items-center justify-center gap-2 text-xs text-ink-secondary">
                <ShieldCheck className="h-4 w-4 text-accent-primary" />
                Protected by 30-day audition & 5-year warranty
              </p>
            </aside>
          </form>
        )}
      </div>
    </StorefrontShell>
  );
}
