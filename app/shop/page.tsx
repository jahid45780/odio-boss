'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { Brand, Category, Product, WebsiteSettings } from '@/lib/types';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function ShopContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['website-settings'],
    queryFn: async () => (await api.get('/settings')).data.data.settings as WebsiteSettings,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data.categories as Category[],
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await api.get('/brands')).data.data.brands as Brand[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['shop-products', search, category, brand, minPrice, maxPrice, minRating, inStock, sort, page],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          search: search || undefined,
          category: category || undefined,
          brand: brand || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          minRating: minRating || undefined,
          inStock: inStock ? 'true' : undefined,
          sort,
          page,
          limit: 9,
        },
      });
      return res.data.data as {
        products: Product[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
  });

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setInStock(false);
    setSort('newest');
    setPage(1);
  };

  const products = data?.products || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary mb-3">Search</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-secondary" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Model or SKU..."
            className="pl-9"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary mb-3">Category</h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => {
              setCategory('');
              setPage(1);
            }}
            className={`w-full text-left px-3 py-2 rounded-theme-control text-sm transition-colors cursor-pointer ${
              !category
                ? 'bg-accent-primary/15 text-accent-primary font-medium'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-elevated'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(c.slug);
                setPage(1);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-theme-control text-sm transition-colors cursor-pointer ${
                category === c.slug
                  ? 'bg-accent-primary/15 text-accent-primary font-medium'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-elevated'
              }`}
            >
              <span className="truncate">{c.name}</span>
              <span className="text-xs tabular-nums opacity-70">{c.productCount ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary mb-3">Brand</h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => {
              setBrand('');
              setPage(1);
            }}
            className={`w-full text-left px-3 py-2 rounded-theme-control text-sm transition-colors cursor-pointer ${
              !brand
                ? 'bg-accent-primary/15 text-accent-primary font-medium'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-elevated'
            }`}
          >
            All Brands
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setBrand(b.slug);
                setPage(1);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-theme-control text-sm transition-colors cursor-pointer ${
                brand === b.slug
                  ? 'bg-accent-primary/15 text-accent-primary font-medium'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-elevated'
              }`}
            >
              <span className="truncate">{b.name}</span>
              <span className="text-xs tabular-nums opacity-70">{b.productCount ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary mb-3">
          Price Range ({settings?.currencySymbol || '$'})
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setPage(1);
            }}
          />
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-primary mb-3">Minimum Rating</h3>
        <select
          value={minRating}
          onChange={(e) => {
            setMinRating(e.target.value);
            setPage(1);
          }}
          className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
        >
          <option value="">Any rating</option>
          <option value="4.5">4.5 stars & up</option>
          <option value="4">4.0 stars & up</option>
          <option value="3">3.0 stars & up</option>
        </select>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => {
            setInStock(e.target.checked);
            setPage(1);
          }}
          className="h-4 w-4 accent-[var(--accent-primary)] rounded"
        />
        In stock only
      </label>

      <Button variant="outline" size="sm" className="w-full" onClick={resetFilters}>
        Reset Filters
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-line-subtle">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-accent-primary">
            SONIQ Catalog
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-ink-primary">
            Precision Audio Speakers
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex h-10 items-center gap-2 rounded-theme-control border border-line-strong bg-surface-card px-4 text-sm text-ink-primary cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4 text-accent-primary" />
            Filters
          </button>

          <select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-theme-control border border-line-strong bg-surface-card px-3.5 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="popular">Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="hidden lg:block lg:col-span-3 rounded-theme-card border border-line-subtle bg-surface-card p-6 self-start shadow-theme-card">
          {FilterPanel}
        </aside>

        <div className="lg:col-span-9">
          <div className="mb-5 flex items-center justify-between text-xs text-ink-secondary">
            <span className="tabular-nums">
              Showing {products.length} of {pagination.total} speakers
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-96 rounded-theme-card border border-line-subtle bg-surface-card animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-theme-card border border-line-subtle bg-surface-card p-12 text-center shadow-theme-card">
              <p className="font-display text-lg font-semibold text-ink-primary">No matching speakers</p>
              <p className="mt-1 text-sm text-ink-secondary">
                Adjust your price range, category, or search term to view available models.
              </p>
              <Button variant="secondary" className="mt-5" onClick={resetFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currencySymbol={settings?.currencySymbol || '$'}
                />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="px-4 text-xs text-ink-secondary tabular-nums">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/65" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative z-10 w-80 max-w-full h-full bg-surface-card border-r border-line-subtle p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-line-subtle">
              <span className="font-display text-lg font-semibold text-ink-primary">Filter Speakers</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-ink-secondary hover:text-ink-primary cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {FilterPanel}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <StorefrontShell>
      <Suspense fallback={<div className="mx-auto max-w-7xl px-6 py-20 text-ink-secondary">Loading catalog...</div>}>
        <ShopContent />
      </Suspense>
    </StorefrontShell>
  );
}
