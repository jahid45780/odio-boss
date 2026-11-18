'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Banner, Coupon, Review } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SafeImage } from '@/components/ui/safe-image';
import { ImageUploader } from './ImageUploader';

export function CouponsPanel() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: '10',
    minOrderAmount: '0',
    maxDiscountAmount: '',
    usageLimit: '',
    expiresAt: '',
    isActive: true,
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => (await api.get('/coupons')).data.data.coupons as Coupon[],
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '15',
      minOrderAmount: '250',
      maxDiscountAmount: '500',
      usageLimit: '100',
      expiresAt: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderAmount: String(c.minOrderAmount),
      maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : '',
      usageLimit: c.usageLimit ? String(c.usageLimit) : '',
      expiresAt: c.expiresAt.slice(0, 10),
      isActive: c.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: new Date(form.expiresAt).toISOString(),
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/coupons/${editing.id}`, payload);
        toast.success('Coupon updated');
      } else {
        await api.post('/coupons', payload);
        toast.success('Coupon created');
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <div className="rounded-theme-card border border-line-subtle bg-surface-card overflow-hidden shadow-theme-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-subtle bg-surface-secondary text-xs text-ink-secondary">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-surface-elevated/60">
                  <td className="px-4 py-3 font-mono font-semibold text-ink-primary">{c.code}</td>
                  <td className="px-4 py-3 tabular-nums text-ink-primary">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `$${c.discountValue}`}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-xs text-ink-secondary">
                    {c.usedCount} / {c.usageLimit ?? '∞'}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-secondary">{formatDate(c.expiresAt)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={c.isActive ? 'text-accent-primary font-medium' : 'text-ink-secondary'}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => openEdit(c)} className="p-1.5 text-ink-secondary hover:text-ink-primary cursor-pointer">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => handleDelete(c.id)} className="p-1.5 text-ink-secondary hover:text-red-500 cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <Input required placeholder="CODE (e.g. SONIQ20)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.discountType}
                onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' }))}
                className="h-10 rounded-theme-control border border-line-subtle bg-surface-secondary px-3 text-sm text-ink-primary focus:border-accent-primary focus:outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ($)</option>
              </select>
              <Input required type="number" step="0.01" placeholder="Value" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} />
              <Input type="number" placeholder="Min order ($)" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} />
              <Input type="number" placeholder="Usage limit" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-ink-secondary mb-1">Expiry Date</label>
              <Input type="date" required value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-xs text-ink-primary cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="accent-[var(--accent-primary)]" />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Coupon</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BannersPanel() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    ctaText: 'Explore Collection',
    ctaLink: '/shop',
    imageUrl: '/images/hero-flagship.jpg',
    displayOrder: '1',
    isActive: true,
  });

  const { data: banners = [] } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => (await api.get('/banners?includeInactive=true')).data.data.banners as Banner[],
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      subtitle: '',
      ctaText: 'Explore Collection',
      ctaLink: '/shop',
      imageUrl: '/images/cinema-soundbar.jpg',
      displayOrder: '1',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle,
      ctaText: b.ctaText,
      ctaLink: b.ctaLink,
      imageUrl: b.imageUrl,
      displayOrder: String(b.displayOrder),
      isActive: b.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, displayOrder: Number(form.displayOrder) };
      if (editing) {
        await api.patch(`/banners/${editing.id}`, payload);
        toast.success('Banner updated');
      } else {
        await api.post('/banners', payload);
        toast.success('Banner created');
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/banners/${id}`);
      toast.success('Banner deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {banners.map((b) => (
          <div key={b.id} className="rounded-theme-card border border-line-subtle bg-surface-card overflow-hidden shadow-theme-card">
            <div className="relative h-44 bg-surface-elevated">
              <SafeImage src={b.imageUrl} alt={b.title} fill className="object-cover" />
            </div>
            <div className="p-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-accent-primary font-medium">
                  Order #{b.displayOrder} · {b.isActive ? 'Active' : 'Inactive'}
                </p>
                <h3 className="font-display text-lg font-semibold text-ink-primary mt-1">{b.title}</h3>
                <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{b.subtitle}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => openEdit(b)} className="p-1.5 text-ink-secondary hover:text-ink-primary cursor-pointer">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => handleDelete(b.id)} className="p-1.5 text-ink-secondary hover:text-red-500 cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Promotional Banner' : 'Create Promotional Banner'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <Input required placeholder="Banner title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="CTA Text" value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))} />
              <Input placeholder="CTA Link" value={form.ctaLink} onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))} />
            </div>
            <ImageUploader
              folder="soniq/banners"
              label="Upload Banner Image"
              value={form.imageUrl ? [form.imageUrl] : []}
              onChange={(urls) => setForm((f) => ({ ...f, imageUrl: urls[0] || '' }))}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-ink-primary cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="accent-[var(--accent-primary)]" />
                Active on Homepage
              </label>
              <Input type="number" className="w-24" placeholder="Order" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Banner</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ReviewsPanel() {
  const queryClient = useQueryClient();
  const { data: reviews = [] } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => (await api.get('/reviews?all=true')).data.data.reviews as Review[],
  });

  const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/reviews/${id}`, { status });
      toast.success(`Review ${status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-theme-card border border-line-subtle bg-surface-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-theme-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-accent-primary">{r.productName || r.productId}</span>
              <span aria-hidden="true">·</span>
              <span className="text-ink-primary tabular-nums">{r.rating}/5 Stars</span>
              <span aria-hidden="true">·</span>
              <span className={r.status === 'APPROVED' ? 'text-emerald-500 font-medium' : r.status === 'REJECTED' ? 'text-red-500 font-medium' : 'text-amber-500 font-medium'}>
                {r.status}
              </span>
            </div>
            <p className="font-display font-semibold text-ink-primary">{r.title}</p>
            <p className="text-sm text-ink-secondary">{r.comment}</p>
            <p className="text-xs text-ink-secondary">By {r.authorName} on {formatDate(r.createdAt)}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="secondary" onClick={() => updateStatus(r.id, 'APPROVED')}>
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'REJECTED')}>
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
