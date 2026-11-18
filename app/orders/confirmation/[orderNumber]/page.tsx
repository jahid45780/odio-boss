'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Order } from '@/lib/types';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { Button } from '@/components/ui/button';
import { SafeImage } from '@/components/ui/safe-image';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-confirmation', orderNumber],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderNumber}`);
      return res.data.data.order as Order;
    },
  });

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        {isLoading ? (
          <div className="rounded-theme-card border border-line-subtle bg-surface-card p-10 text-center text-ink-secondary">
            Loading order receipt...
          </div>
        ) : error || !order ? (
          <div className="rounded-theme-card border border-line-subtle bg-surface-card p-10 text-center shadow-theme-card">
            <h1 className="font-display text-2xl font-semibold text-ink-primary">Order Not Found</h1>
            <p className="mt-2 text-sm text-ink-secondary">
              We could not locate order {orderNumber}.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-theme-card border border-line-subtle bg-surface-card p-6 sm:p-10 space-y-8 shadow-theme-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line-subtle">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-8 w-8 text-accent-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-accent-primary">
                    Order Confirmed
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-primary">
                    {order.orderNumber}
                  </h1>
                  <p className="text-xs text-ink-secondary mt-1">
                    Placed on {formatDate(order.createdAt)} · Status: {order.orderStatus}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-ink-secondary">Total Amount</p>
                <p className="font-display text-2xl font-bold text-ink-primary tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-2">
                  Shipping Destination
                </h2>
                <p className="font-medium text-ink-primary">{order.customerName}</p>
                <p className="text-ink-secondary mt-1">{order.shippingAddress}</p>
                <p className="text-ink-secondary">
                  {order.shippingCity}, {order.postalCode} · {order.shippingCountry}
                </p>
                <p className="text-ink-secondary mt-1">{order.customerPhone}</p>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-2">
                  Payment & Dispatch
                </h2>
                <p className="text-ink-primary">Method: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
                <p className="text-ink-secondary mt-1">Payment Status: {order.paymentStatus}</p>
                <p className="text-ink-secondary mt-1">Email: {order.customerEmail}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-line-subtle">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                Reserved Systems
              </h2>
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 rounded-theme-control bg-surface-secondary p-3 border border-line-subtle">
                  <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-theme-control bg-surface-elevated">
                    <SafeImage src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-primary truncate">{item.name}</p>
                    <p className="text-xs text-ink-secondary tabular-nums">
                      SKU {item.sku} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink-primary tabular-nums">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-line-subtle space-y-2 text-sm">
              <div className="flex justify-between text-ink-secondary">
                <span>Subtotal</span>
                <span className="text-ink-primary tabular-nums">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-accent-primary">
                  <span>Discount ({order.couponCode})</span>
                  <span className="tabular-nums">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-secondary">
                <span>Shipping</span>
                <span className="text-ink-primary tabular-nums">
                  {order.shippingFee === 0 ? 'Complimentary' : formatCurrency(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-line-subtle font-semibold text-ink-primary">
                <span>Total</span>
                <span className="font-display text-lg tabular-nums">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link href="/shop">
                  Continue Exploring
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/account?tab=orders">
                  <Package className="h-4 w-4" />
                  Track My Orders
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
