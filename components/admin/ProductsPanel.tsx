'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Brand, Category, Product, ProductSpec } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SafeImage } from '@/components/ui/safe-image';
import { ImageUploader } from './ImageUploader';

export function ProductsPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    previousPrice: '',
    categoryId: '',
    brandId: '',
    stock: '10',
    shortDescription: '',
    description: '',
    images: [] as string[],
    specs: [{ label: 'Frequency Response', value: '30 Hz – 30 kHz' }] as ProductSpec[],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isPublished: true,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: { includeUnpublished: 'true', limit: 50, search: search || undefined },
      });
      return res.data.data.products as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => (await api.get('/categories?includeInactive=true')).data.data.categories as Category[],
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => (await api.get('/brands')).data.data.brands as Brand[],
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      sku: `SNQ-${Math.floor(1000 + Math.random() * 9000)}`,
      price: '',
      previousPrice: '',
      categoryId: categories[0]?.id || '',
      brandId: brands[0]?.id || '',
      stock: '10',
      shortDescription: '',
      description: '',
      images: ['/images/studio-monitor.jpg'],
      specs: [{ label: 'Frequency Response', value: '28 Hz – 35 kHz' }],
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      isPublished: true,
    });
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      price: String(p.price),
      previousPrice: p.previousPrice ? String(p.previousPrice) : '',
      categoryId: p.categoryId,
      brandId: p.brandId,
      stock: String(p.stock),
      shortDescription: p.shortDescription,
      description: p.description,
      images: p.images,
      specs: p.specs.length > 0 ? p.specs : [{ label: 'Frequency Response', value: '30 Hz – 30 kHz' }],
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      isNewArrival: p.isNewArrival,
      isPublished: p.isPublished,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.images.length === 0) {
      toast.error('Please upload at least one product image.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        price: Number(form.price),
        previousPrice: form.previousPrice ? Number(form.previousPrice) : null,
        categoryId: form.categoryId,
        brandId: form.brandId,
        stock: Number(form.stock),
        shortDescription: form.shortDescription,
        description: form.description,
        images: form.images,
        specs: form.specs.filter((s) => s.label.trim() && s.value.trim()),
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
        isNewArrival: form.isNewArrival,
        isPublished: form.isPublished,
      };

      if (editing) {
        await api.patch(`/products/${editing.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }

      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics-overview'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    try {
      await api.delete(`/products/${p.id}`);
      toast.success(`${p.name} deleted`);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or SKU..."
          className="max-w-sm"
        />
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Speaker
        </Button>
      </div>

      <div className="rounded-theme-card border border-line-subtle bg-surface-card overflow-hidden shadow-theme-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-subtle bg-surface-secondary text-xs text-ink-secondary">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-secondary">
                    Loading products...
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-elevated/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded-theme-control bg-surface-elevated">
                          <SafeImage src={p.images[0] || '/images/hero-flagship.jpg'} alt={p.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink-primary truncate max-w-[220px]">{p.name}</p>
                          <p className="text-xs text-ink-secondary">{p.brandName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-secondary">{p.sku}</td>
                    <td className="px-4 py-3 text-xs text-ink-secondary">{p.categoryName}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-primary tabular-nums">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={p.stock <= 5 ? 'text-amber-500 font-semibold' : 'text-ink-primary'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={p.isPublished ? 'text-accent-primary font-medium' : 'text-ink-secondary'}>
                        {p.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          aria-label="Edit product"
                          className="p-2 text-ink-secondary hover:text-ink-primary cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          aria-label="Delete product"
                          className="p-2 text-ink-secondary hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Create Speaker Product'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="mt-4 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Product Name</label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1">SKU</label>
                <Input required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Price ($)</label>
                <Input required type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Previous Price ($ Optional)</label>
                <Input type="number" step="0.01" value={form.previousPrice} onChange={(e) => setForm((f) => ({ ...f, previousPrice: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Category</label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Brand</label>
                <select
                  required
                  value={form.brandId}
                  onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                  className="w-full h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Stock Quantity</label>
                <Input required type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-xs text-ink-secondary mb-1">Short Summary</label>
              <Input
                value={form.shortDescription}
                onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs text-ink-secondary mb-1">Full Description</label>
              <Textarea
                required
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs text-ink-secondary mb-2">Product Images (Cloudinary / Local)</label>
              <ImageUploader
                multiple
                folder="soniq/products"
                label="Upload Product Images"
                value={form.images}
                onChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-ink-secondary">Technical Specifications</label>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, specs: [...f.specs, { label: '', value: '' }] }))}
                  className="text-xs text-accent-primary hover:underline cursor-pointer"
                >
                  + Add Spec Row
                </button>
              </div>
              {form.specs.map((spec, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder="Label (e.g. Peak SPL)"
                    value={spec.label}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        specs: f.specs.map((s, i) => (i === idx ? { ...s, label: e.target.value } : s)),
                      }))
                    }
                  />
                  <Input
                    placeholder="Value (e.g. 118 dB)"
                    value={spec.value}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        specs: f.specs.map((s, i) => (i === idx ? { ...s, value: e.target.value } : s)),
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, specs: f.specs.filter((_, i) => i !== idx) }))}
                    className="p-2 text-ink-secondary hover:text-red-500 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-5 pt-2 border-t border-line-subtle text-xs text-ink-primary">
              {[
                { key: 'isPublished', label: 'Published' },
                { key: 'isFeatured', label: 'Featured' },
                { key: 'isBestSeller', label: 'Best Seller' },
                { key: 'isNewArrival', label: 'New Arrival' },
              ].map((flag) => (
                <label key={flag.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form[flag.key as keyof typeof form])}
                    onChange={(e) => setForm((f) => ({ ...f, [flag.key]: e.target.checked }))}
                    className="accent-[var(--accent-primary)]"
                  />
                  {flag.label}
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
