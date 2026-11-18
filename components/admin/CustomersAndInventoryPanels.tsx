'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { InventoryLog, Order, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  isBlocked: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export function CustomersPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['admin-customers', search],
    queryFn: async () => (await api.get('/users', { params: { search: search || undefined } })).data.data.customers as CustomerRow[],
  });

  const { data: customerDetail } = useQuery({
    queryKey: ['admin-customer-detail', selectedCustomerId],
    queryFn: async () => (await api.get(`/users/${selectedCustomerId}`)).data.data as { customer: CustomerRow; orders: Order[] },
    enabled: Boolean(selectedCustomerId),
  });

  const toggleBlock = async (c: CustomerRow) => {
    try {
      await api.patch(`/users/${c.id}`, { isBlocked: !c.isBlocked });
      toast.success(c.isBlocked ? `${c.name} unblocked` : `${c.name} blocked`);
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search customers by name or email..."
        className="max-w-sm"
      />

      <div className="rounded-theme-card border border-line-subtle bg-surface-card overflow-hidden shadow-theme-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-subtle bg-surface-secondary text-xs text-ink-secondary">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Orders</th>
                <th className="px-4 py-3 font-medium text-right">Total Spent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-secondary">Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-secondary">No customers found.</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-elevated/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-primary">{c.name}</p>
                      <p className="text-xs text-ink-secondary">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-secondary">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-primary">{c.orderCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-ink-primary">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={c.isBlocked ? 'text-red-500 font-medium' : 'text-accent-primary font-medium'}>
                        {c.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedCustomerId(c.id)}>
                          <Eye className="h-3.5 w-3.5" />
                          Profile
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleBlock(c)}>
                          {c.isBlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          {c.isBlocked ? 'Unblock' : 'Block'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(selectedCustomerId)} onOpenChange={(o) => !o && setSelectedCustomerId(null)}>
        <DialogContent className="max-w-2xl">
          {customerDetail && (
            <>
              <DialogHeader>
                <DialogTitle>{customerDetail.customer.name}</DialogTitle>
              </DialogHeader>
              <div className="mt-3 space-y-4 text-sm">
                <p className="text-xs text-ink-secondary">
                  {customerDetail.customer.email} · {customerDetail.customer.phone || 'No phone on file'}
                </p>
                <h3 className="font-display font-semibold text-ink-primary pt-2">Order History ({customerDetail.orders.length})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {customerDetail.orders.length === 0 ? (
                    <p className="text-xs text-ink-secondary">No orders placed yet.</p>
                  ) : (
                    customerDetail.orders.map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between rounded-theme-control bg-surface-secondary border border-line-subtle p-3 text-xs">
                        <div>
                          <p className="font-mono text-ink-primary">{ord.orderNumber}</p>
                          <p className="text-ink-secondary">{formatDate(ord.createdAt)} · {ord.orderStatus}</p>
                        </div>
                        <span className="font-semibold text-ink-primary tabular-nums">{formatCurrency(ord.totalAmount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function InventoryPanel() {
  const queryClient = useQueryClient();
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState('0');
  const [reason, setReason] = useState('Warehouse restock');

  const { data } = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: async () =>
      (await api.get('/inventory')).data.data as {
        products: Product[];
        lowStock: Product[];
        outOfStock: Product[];
        logs: InventoryLog[];
      },
  });

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    try {
      await api.patch(`/inventory/${adjustingProduct.id}`, {
        stock: Number(newStock),
        reason,
      });
      toast.success(`Stock updated for ${adjustingProduct.sku}`);
      setAdjustingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics-overview'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const products = data?.products || [];
  const logs = data?.logs || [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-theme-card border border-line-subtle bg-surface-card p-5 shadow-theme-card">
          <p className="text-xs text-ink-secondary">Total Tracked SKUs</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-primary tabular-nums">{products.length}</p>
        </div>
        <div className="rounded-theme-card border border-line-subtle bg-surface-card p-5 shadow-theme-card">
          <p className="text-xs text-ink-secondary">Low Stock (1–10 units)</p>
          <p className="mt-1 font-display text-2xl font-bold text-amber-500 tabular-nums">{data?.lowStock.length ?? 0}</p>
        </div>
        <div className="rounded-theme-card border border-line-subtle bg-surface-card p-5 shadow-theme-card">
          <p className="text-xs text-ink-secondary">Out of Stock</p>
          <p className="mt-1 font-display text-2xl font-bold text-red-500 tabular-nums">{data?.outOfStock.length ?? 0}</p>
        </div>
      </div>

      <div className="rounded-theme-card border border-line-subtle bg-surface-card overflow-hidden shadow-theme-card">
        <div className="px-5 py-4 border-b border-line-subtle">
          <h2 className="font-display text-lg font-semibold text-ink-primary">SKU Stock Levels</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-subtle bg-surface-secondary text-xs text-ink-secondary">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium text-right">Available</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-surface-elevated/60">
                  <td className="px-4 py-3 font-medium text-ink-primary">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-secondary">{p.sku}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={p.stock === 0 ? 'text-red-500 font-semibold' : p.stock <= 10 ? 'text-amber-500 font-semibold' : 'text-ink-primary'}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setAdjustingProduct(p);
                        setNewStock(String(p.stock));
                        setReason('Manual stock replenishment');
                      }}
                    >
                      Adjust Stock
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-theme-card border border-line-subtle bg-surface-card overflow-hidden shadow-theme-card">
        <div className="px-5 py-4 border-b border-line-subtle">
          <h2 className="font-display text-lg font-semibold text-ink-primary">Stock Movement Audit Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line-subtle bg-surface-secondary text-ink-secondary">
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium text-right">Delta</th>
                <th className="px-4 py-3 font-medium text-right">New Stock</th>
                <th className="px-4 py-3 font-medium">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-ink-secondary">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 font-mono text-ink-primary">{log.sku}</td>
                  <td className="px-4 py-3 text-ink-secondary">{log.reason}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-semibold ${log.changeAmount >= 0 ? 'text-accent-primary' : 'text-amber-500'}`}>
                    {log.changeAmount >= 0 ? `+${log.changeAmount}` : log.changeAmount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-primary">{log.newStock}</td>
                  <td className="px-4 py-3 text-ink-secondary">{log.actorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(adjustingProduct)} onOpenChange={(o) => !o && setAdjustingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock · {adjustingProduct?.sku}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs text-ink-secondary mb-1">New Stock Quantity</label>
              <Input type="number" min={0} required value={newStock} onChange={(e) => setNewStock(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-ink-secondary mb-1">Adjustment Reason</label>
              <Input required value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAdjustingProduct(null)}>Cancel</Button>
              <Button type="submit">Save Stock</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
