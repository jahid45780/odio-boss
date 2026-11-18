'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import type { Brand, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SafeImage } from '@/components/ui/safe-image';
import { ImageUploader } from './ImageUploader';

export function CategoriesPanel() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '', sortOrder: '0', isActive: true });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => (await api.get('/categories?includeInactive=true')).data.data.categories as Category[],
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', imageUrl: '/images/studio-monitor.jpg', sortOrder: '0', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description,
      imageUrl: c.imageUrl,
      sortOrder: String(c.sortOrder),
      isActive: c.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) };
      if (editing) {
        await api.patch(`/categories/${editing.id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created');
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (c: Category) => {
    try {
      await api.delete(`/categories/${c.id}`);
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
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
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="rounded-theme-card border border-line-subtle bg-surface-card overflow-hidden flex flex-col shadow-theme-card">
            <div className="relative h-36 bg-surface-elevated">
              <SafeImage src={c.imageUrl || '/images/hero-flagship.jpg'} alt={c.name} fill className="object-cover" />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-semibold text-ink-primary">{c.name}</h3>
                  <span className={`text-xs font-medium ${c.isActive ? 'text-accent-primary' : 'text-ink-secondary'}`}>
                    {c.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{c.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-line-subtle text-xs">
                <span className="text-ink-secondary tabular-nums">{c.productCount ?? 0} products</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => openEdit(c)} className="p-1.5 text-ink-secondary hover:text-ink-primary cursor-pointer">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(c)} className="p-1.5 text-ink-secondary hover:text-red-500 cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <Input required placeholder="Category name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <ImageUploader
              folder="soniq/categories"
              label="Upload Category Image"
              value={form.imageUrl ? [form.imageUrl] : []}
              onChange={(urls) => setForm((f) => ({ ...f, imageUrl: urls[0] || '' }))}
            />
            <label className="flex items-center gap-2 text-xs text-ink-primary cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="accent-[var(--accent-primary)]" />
              Enabled on Storefront
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Category</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BrandsPanel() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: '', description: '', logoUrl: '', isFeatured: true });

  const { data: brands = [] } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => (await api.get('/brands')).data.data.brands as Brand[],
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', logoUrl: '', isFeatured: true });
    setModalOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({ name: b.name, description: b.description, logoUrl: b.logoUrl, isFeatured: b.isFeatured });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/brands/${editing.id}`, form);
        toast.success('Brand updated');
      } else {
        await api.post('/brands', form);
        toast.success('Brand created');
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (b: Brand) => {
    try {
      await api.delete(`/brands/${b.id}`);
      toast.success('Brand deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
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
          Add Brand
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brands.map((b) => (
          <div key={b.id} className="rounded-theme-card border border-line-subtle bg-surface-card p-5 flex items-center justify-between gap-4 shadow-theme-card">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-ink-primary">{b.name}</h3>
              <p className="text-xs text-ink-secondary mt-1 line-clamp-1">{b.description}</p>
              <p className="text-xs text-accent-primary mt-1 tabular-nums">{b.productCount ?? 0} models</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button type="button" onClick={() => openEdit(b)} className="p-2 text-ink-secondary hover:text-ink-primary cursor-pointer">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => handleDelete(b)} className="p-2 text-ink-secondary hover:text-red-500 cursor-pointer">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Brand' : 'Create Brand'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <Input required placeholder="Brand name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <ImageUploader
              folder="soniq/brands"
              label="Upload Brand Logo"
              value={form.logoUrl ? [form.logoUrl] : []}
              onChange={(urls) => setForm((f) => ({ ...f, logoUrl: urls[0] || '' }))}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Brand</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
