'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SafeImage } from '@/components/ui/safe-image';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Product, WebsiteSettings } from '@/lib/types';

export function SearchModal({ settings }: { settings?: WebsiteSettings }) {
  const isSearchOpen = useStore((s) => s.isSearchOpen);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState('');
  const symbol = settings?.currencySymbol || '$';

  const { data, isFetching } = useQuery({
    queryKey: ['product-search', query],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: { search: query.trim(), limit: 6 },
      });
      return res.data.data.products as Product[];
    },
    enabled: isSearchOpen,
  });

  const products = data || [];

  return (
    <Dialog open={isSearchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search SONIQ Speakers</DialogTitle>
        </DialogHeader>
        <div className="relative mt-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-secondary" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by model, SKU, category, or acoustic brand..."
            className="pl-10 h-11"
          />
        </div>

        <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
          {isFetching ? (
            <p className="text-sm text-ink-secondary py-6 text-center">Searching catalog...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-ink-secondary py-6 text-center">
              No speakers matched &ldquo;{query}&rdquo;.
            </p>
          ) : (
            products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                onClick={() => setSearchOpen(false)}
                className="flex items-center gap-4 rounded-theme-control border border-line-subtle bg-surface-secondary p-3 hover:border-accent-primary/60 transition-colors"
              >
                <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-theme-control bg-surface-elevated">
                  <SafeImage src={p.images[0] || '/images/hero-flagship.jpg'} alt={p.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-primary truncate">{p.name}</p>
                  <p className="text-xs text-ink-secondary truncate">
                    {p.brandName} · {p.categoryName} · {p.sku}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-ink-primary tabular-nums">
                    {formatCurrency(p.price, symbol)}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-line-subtle flex justify-end">
          <Link
            href={query.trim() ? `/shop?search=${encodeURIComponent(query.trim())}` : '/shop'}
            onClick={() => setSearchOpen(false)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-primary hover:underline"
          >
            Browse Full Shop
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
