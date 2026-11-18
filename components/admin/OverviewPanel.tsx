'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Order, Product } from '@/lib/types';

interface OverviewResponse {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    pendingOrders: number;
    completedOrders: number;
    lowStockCount: number;
  };
  monthlySeries: Array<{ month: string; revenue: number; orders: number }>;
  recentOrders: Order[];
  lowStockProducts: Product[];
  bestSellingProducts: Product[];
}

export function OverviewPanel({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: async () => (await api.get('/analytics/overview')).data.data as OverviewResponse,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-theme-card border border-line-subtle bg-surface-card animate-pulse" />
        ))}
      </div>
    );
  }

  const { kpis, monthlySeries, recentOrders, lowStockProducts, bestSellingProducts } = data;
  const maxRevenue = Math.max(1, ...monthlySeries.map((m) => m.revenue));

  const kpiCards = [
    { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue), sub: `${kpis.totalOrders} valid orders` },
    { label: 'Pending Orders', value: String(kpis.pendingOrders), sub: `${kpis.completedOrders} delivered` },
    { label: 'Active Products', value: String(kpis.totalProducts), sub: `${kpis.lowStockCount} low stock` },
    { label: 'Registered Customers', value: String(kpis.totalCustomers), sub: 'Live database accounts' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="rounded-theme-card border border-line-subtle bg-surface-card p-5 shadow-theme-card">
            <p className="text-xs font-medium text-ink-secondary">{card.label}</p>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink-primary tabular-nums">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-accent-primary tabular-nums">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly Sales Chart + Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-theme-card border border-line-subtle bg-surface-card p-6 shadow-theme-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-primary">Monthly Revenue Analytics</h2>
              <p className="text-xs text-ink-secondary">Aggregated from non-cancelled orders in database</p>
            </div>
          </div>

          {monthlySeries.length === 0 ? (
            <p className="text-sm text-ink-secondary py-12 text-center">No order revenue recorded yet.</p>
          ) : (
            <div className="flex items-end gap-3 h-56 pt-4">
              {monthlySeries.map((m) => {
                const heightPct = Math.max(8, Math.round((m.revenue / maxRevenue) * 100));
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[11px] font-mono text-ink-primary tabular-nums">
                      {formatCurrency(m.revenue)}
                    </span>
                    <div className="w-full max-w-[54px] bg-surface-secondary rounded-t-md flex items-end h-36 overflow-hidden border border-line-subtle">
                      <div
                        style={{
                          height: `${heightPct}%`,
                          background: 'linear-gradient(to top, var(--accent-secondary), var(--accent-primary))',
                        }}
                        className="w-full transition-all"
                      />
                    </div>
                    <span className="text-[11px] font-mono text-ink-secondary">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-theme-card border border-line-subtle bg-surface-card p-6 shadow-theme-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-ink-primary">Best Selling Speakers</h2>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="text-xs text-accent-primary hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>
          <div className="divide-y divide-line-subtle">
            {bestSellingProducts.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-ink-primary truncate">{p.name}</p>
                  <p className="text-xs text-ink-secondary font-mono">{p.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-ink-primary tabular-nums">{p.soldCount} sold</p>
                  <p className="text-xs text-ink-secondary tabular-nums">{formatCurrency(p.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-theme-card border border-line-subtle bg-surface-card p-6 shadow-theme-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-ink-primary">Recent Orders</h2>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs text-accent-primary hover:underline cursor-pointer"
            >
              View All Orders
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line-subtle text-ink-secondary">
                  <th className="py-2.5 font-medium">Order</th>
                  <th className="py-2.5 font-medium">Customer</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 font-medium">Date</th>
                  <th className="py-2.5 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-elevated/60">
                    <td className="py-3 font-mono text-ink-primary">{o.orderNumber}</td>
                    <td className="py-3 text-ink-secondary">{o.customerName}</td>
                    <td className="py-3 text-accent-primary font-medium">{o.orderStatus}</td>
                    <td className="py-3 text-ink-secondary">{formatDate(o.createdAt)}</td>
                    <td className="py-3 text-right font-semibold text-ink-primary tabular-nums">
                      {formatCurrency(o.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-theme-card border border-line-subtle bg-surface-card p-6 shadow-theme-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-ink-primary">Low & Out-of-Stock</h2>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs text-accent-primary hover:underline cursor-pointer"
            >
              Adjust Stock
            </button>
          </div>
          <div className="divide-y divide-line-subtle">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-ink-secondary py-6">All SKUs are well stocked.</p>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-primary truncate">{p.name}</p>
                    <p className="text-xs text-ink-secondary font-mono">{p.sku}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold tabular-nums shrink-0 ${
                      p.stock === 0 ? 'text-red-500' : 'text-amber-500'
                    }`}
                  >
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
