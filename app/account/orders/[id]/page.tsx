'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Order } from '@/lib/types';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { SafeImage } from '@/components/ui/safe-image';

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['account-order', id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data.data.order as Order,
  });

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <Link
          href="/account?tab=orders"
          className="inline-flex items-center gap-2 text-xs text-ink-secondary hover:text-ink-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Orders
        </Link>

        {isLoading ? (
          <div className="rounded-theme-card border border-line-subtle bg-surface-card p-8 text-ink-secondary">
            Loading order details...
          </div>
        ) : !order ? (
          <div className="rounded-theme-card border border-line-subtle bg-surface-card p-8 text-ink-primary">
            Order not found or access denied.
          </div>
        ) : (
          <div className="rounded-theme-card border border-line-subtle bg-surface-card p-6 sm:p-8 space-y-6 shadow-theme-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line-subtle pb-5">
              <div>
                <p className="font-mono text-sm text-accent-primary">{order.orderNumber}</p>
                <h1 className="font-display text-2xl font-semibold text-ink-primary mt-1">
                  Status: {order.orderStatus}
                </h1>
                <p className="text-xs text-ink-secondary mt-1">Placed {formatDate(order.createdAt)}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-ink-secondary">Total</p>
                <p className="font-display text-2xl font-bold text-ink-primary tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>
            </div>

            {order.trackingNumber && (
              <div className="rounded-theme-control bg-surface-secondary border border-line-subtle px-4 py-3 text-sm">
                <span className="text-ink-secondary">Courier Tracking Number: </span>
                <span className="font-mono text-accent-primary font-medium">{order.trackingNumber}</span>
              </div>
            )}

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 rounded-theme-control bg-surface-secondary border border-line-subtle p-3.5">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-line-subtle text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-secondary mb-1.5">Shipping Address</p>
                <p className="text-ink-primary font-medium">{order.customerName}</p>
                <p className="text-ink-secondary">{order.shippingAddress}</p>
                <p className="text-ink-secondary">
                  {order.shippingCity}, {order.postalCode} · {order.shippingCountry}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-ink-secondary mb-1.5">Financial Summary</p>
                <div className="flex justify-between text-ink-secondary">
                  <span>Subtotal</span>
                  <span className="text-ink-primary tabular-nums">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-accent-primary">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-secondary">
                  <span>Shipping</span>
                  <span className="text-ink-primary tabular-nums">{formatCurrency(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between text-ink-primary font-semibold pt-1 border-t border-line-subtle">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
