'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Order, OrderStatus, PaymentStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
];

const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

export function OrdersPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('Pending');
  const [nextPayment, setNextPayment] = useState<PaymentStatus>('PENDING');
  const [tracking, setTracking] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/orders', {
        params: { search: search || undefined, status: statusFilter },
      });
      return res.data.data.orders as Order[];
    },
  });

  const openOrder = (o: Order) => {
    setSelectedOrder(o);
    setNextStatus(o.orderStatus);
    setNextPayment(o.paymentStatus);
    setTracking(o.trackingNumber || '');
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await api.patch(`/orders/${selectedOrder.id}/status`, {
        orderStatus: nextStatus,
        paymentStatus: nextPayment,
        trackingNumber: tracking,
      });
      toast.success(`Order ${selectedOrder.orderNumber} updated`);
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order #, customer, or email..."
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-theme-control border border-line-strong bg-surface-card px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="rounded-theme-card border border-line-subtle bg-surface-card overflow-hidden shadow-theme-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-subtle bg-surface-secondary text-xs text-ink-secondary">
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Order Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-secondary">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-secondary">No matching orders found.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-elevated/60">
                    <td className="px-4 py-3 font-mono text-xs text-ink-primary">{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="text-ink-primary font-medium">{o.customerName}</p>
                      <p className="text-xs text-ink-secondary">{o.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-secondary">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-accent-primary font-medium">{o.orderStatus}</td>
                    <td className="px-4 py-3 text-xs text-ink-secondary">
                      {o.paymentMethod} · {o.paymentStatus}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink-primary tabular-nums">
                      {formatCurrency(o.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="secondary" onClick={() => openOrder(o)}>
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order {selectedOrder.orderNumber}</DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-5 text-sm">
                <div className="rounded-theme-control bg-surface-secondary border border-line-subtle p-4 space-y-1">
                  <p className="font-semibold text-ink-primary">{selectedOrder.customerName}</p>
                  <p className="text-xs text-ink-secondary">
                    {selectedOrder.customerEmail} · {selectedOrder.customerPhone}
                  </p>
                  <p className="text-xs text-ink-secondary">
                    {selectedOrder.shippingAddress}, {selectedOrder.shippingCity} {selectedOrder.postalCode}, {selectedOrder.shippingCountry}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">Line Items</p>
                  {selectedOrder.items.map((item) => (
                    <div key={item.productId} className="flex justify-between rounded-theme-control bg-surface-secondary border border-line-subtle px-3.5 py-2.5 text-xs">
                      <span className="text-ink-primary">
                        {item.name} × {item.quantity} ({item.sku})
                      </span>
                      <span className="font-semibold text-ink-primary tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-line-subtle font-semibold text-ink-primary">
                    <span>Order Total</span>
                    <span className="tabular-nums">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>

                <form onSubmit={handleUpdateOrder} className="space-y-4 pt-3 border-t border-line-subtle">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-ink-secondary mb-1">Order Status</label>
                      <select
                        value={nextStatus}
                        onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                        className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-ink-secondary mb-1">Payment Status</label>
                      <select
                        value={nextPayment}
                        onChange={(e) => setNextPayment(e.target.value as PaymentStatus)}
                        className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
                      >
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-ink-secondary mb-1">Courier Tracking Number</label>
                    <Input
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      placeholder="FDX-994821044"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => setSelectedOrder(null)}>
                      Close
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Updating...' : 'Save Order Update'}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
