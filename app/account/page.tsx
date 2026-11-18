'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, MapPin, Package, Settings, Trash2, User, LogOut, Moon, Sun, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/components/theme-provider';
import type { Order } from '@/lib/types';
import type { UserAddress } from '@/lib/auth';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SafeImage } from '@/components/ui/safe-image';

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const initialTab = searchParams.get('tab') || 'profile';
  const [tab, setTab] = useState(initialTab);

  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const { preference, setPreference, activeConfig } = useTheme();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      try {
        return (await api.get('/auth/me')).data.data.user;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => (await api.get('/orders/my-orders')).data.data.orders as Order[],
    enabled: Boolean(user),
  });

  const [profileOverrides, setProfileOverrides] = useState<{ name?: string; phone?: string }>({});
  const profileForm = {
    name: profileOverrides.name ?? user?.name ?? '',
    phone: profileOverrides.phone ?? user?.phone ?? '',
  };

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [addrForm, setAddrForm] = useState({
    label: 'Home Studio',
    fullName: '',
    phone: '',
    country: 'United States',
    city: '',
    address: '',
    postalCode: '',
    isDefault: true,
  });

  const resolvedAddrForm = {
    ...addrForm,
    fullName: addrForm.fullName || user?.name || '',
    phone: addrForm.phone || user?.phone || '',
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch('/auth/profile', profileForm);
      queryClient.setQueryData(['auth-me'], res.data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      toast.success('Password updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch('/auth/profile', { action: 'add_address', address: resolvedAddrForm });
      queryClient.setQueryData(['auth-me'], { ...user, addresses: res.data.data.addresses });
      setAddrForm((a) => ({ ...a, city: '', address: '', postalCode: '' }));
      toast.success('Address saved');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const res = await api.patch('/auth/profile', { action: 'delete_address', addressId });
      queryClient.setQueryData(['auth-me'], { ...user, addresses: res.data.data.addresses });
      toast.success('Address removed');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleLogout = async () => {
    await api.post('/auth/logout');
    queryClient.setQueryData(['auth-me'], null);
    router.push('/');
  };

  if (loadingUser) {
    return <div className="mx-auto max-w-7xl px-6 py-20 text-ink-secondary">Loading account...</div>;
  }

  // Wishlist remains viewable even before sign-in
  if (!user && tab !== 'wishlist') {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-theme-card border border-line-subtle bg-surface-card p-10 space-y-5 shadow-theme-card">
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Sign In Required</h1>
          <p className="text-sm text-ink-secondary">
            Sign in to view your order history, saved addresses, and account settings.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'wishlist', label: `Wishlist (${wishlist.length})`, icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'settings', label: 'Security & Theme', icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-line-subtle">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-primary">
            Customer Account
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink-primary">
            {user ? `Welcome, ${user.name}` : 'Saved Wishlist'}
          </h1>
        </div>
        {user && (
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 rounded-theme-card border border-line-subtle bg-surface-card p-3 space-y-1 shadow-theme-card">
          {tabs.map((item) => {
            if (!user && item.id !== 'wishlist') return null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-theme-control px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  tab === item.id
                    ? 'bg-accent-primary/15 text-accent-primary'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-elevated'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </aside>

        <div className="lg:col-span-9">
          {tab === 'profile' && user && (
            <form
              onSubmit={handleSaveProfile}
              className="rounded-theme-card border border-line-subtle bg-surface-card p-6 sm:p-8 space-y-5 max-w-2xl shadow-theme-card"
            >
              <h2 className="font-display text-xl font-semibold text-ink-primary">Profile Information</h2>
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Full Name</label>
                <Input
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileOverrides((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Email Address</label>
                <Input disabled value={user.email} />
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Phone Number</label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileOverrides((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <Button type="submit">Save Profile</Button>
            </form>
          )}

          {tab === 'orders' && user && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-ink-primary">Order History</h2>
              {orders.length === 0 ? (
                <div className="rounded-theme-card border border-line-subtle bg-surface-card p-8 text-sm text-ink-secondary">
                  You have not placed any orders yet.{' '}
                  <Link href="/shop" className="text-accent-primary hover:underline">
                    Explore speakers
                  </Link>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-theme-card border border-line-subtle bg-surface-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-theme-card"
                  >
                    <div className="space-y-1">
                      <p className="font-mono text-sm font-semibold text-ink-primary">{order.orderNumber}</p>
                      <p className="text-xs text-ink-secondary">
                        {formatDate(order.createdAt)} · {order.items.length} item(s) · Status:{' '}
                        <span className="text-accent-primary font-medium">{order.orderStatus}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-display text-lg font-semibold text-ink-primary tabular-nums">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/account/orders/${order.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'wishlist' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-ink-primary">Saved Wishlist</h2>
              {wishlist.length === 0 ? (
                <div className="rounded-theme-card border border-line-subtle bg-surface-card p-8 text-sm text-ink-secondary">
                  Your wishlist is empty. Save any loudspeaker while browsing the catalog.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-4 rounded-theme-card border border-line-subtle bg-surface-card p-4 shadow-theme-card"
                    >
                      <Link
                        href={`/products/${item.slug}`}
                        className="relative h-20 w-24 shrink-0 overflow-hidden rounded-theme-control bg-surface-elevated"
                      >
                        <SafeImage src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <Link
                            href={`/products/${item.slug}`}
                            className="font-display text-sm font-semibold text-ink-primary hover:text-accent-primary truncate block"
                          >
                            {item.name}
                          </Link>
                          <p className="text-xs text-ink-secondary mt-0.5">{item.brandName}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm font-semibold text-ink-primary tabular-nums">
                            {formatCurrency(item.price)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              toggleWishlist({
                                id: item.productId,
                                slug: item.slug,
                                name: item.name,
                                brandName: item.brandName,
                                price: item.price,
                                images: [item.imageUrl],
                                stock: item.stock,
                                sku: '',
                                description: '',
                                shortDescription: '',
                                previousPrice: null,
                                discountPercentage: 0,
                                categoryId: '',
                                brandId: '',
                                soldCount: 0,
                                ratingAverage: 0,
                                ratingCount: 0,
                                specs: [],
                                isFeatured: false,
                                isBestSeller: false,
                                isNewArrival: false,
                                isPublished: true,
                                createdAt: '',
                                updatedAt: '',
                              })
                            }
                            className="text-xs text-red-500 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'addresses' && user && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-semibold text-ink-primary">Delivery Addresses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user.addresses || []).map((addr: UserAddress) => (
                  <div key={addr.id} className="rounded-theme-card border border-line-subtle bg-surface-card p-5 space-y-1 text-sm shadow-theme-card">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-accent-primary">{addr.label}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-ink-secondary hover:text-red-500 cursor-pointer"
                        aria-label="Delete address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-ink-primary font-medium pt-1">{addr.fullName}</p>
                    <p className="text-ink-secondary">{addr.address}</p>
                    <p className="text-ink-secondary">
                      {addr.city}, {addr.postalCode} · {addr.country}
                    </p>
                    <p className="text-ink-secondary text-xs">{addr.phone}</p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddAddress}
                className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 max-w-2xl shadow-theme-card"
              >
                <h3 className="font-display text-lg font-semibold text-ink-primary">Add New Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    required
                    placeholder="Label (e.g. Listening Room)"
                    value={addrForm.label}
                    onChange={(e) => setAddrForm((a) => ({ ...a, label: e.target.value }))}
                  />
                  <Input
                    required
                    placeholder="Full Name"
                    value={resolvedAddrForm.fullName}
                    onChange={(e) => setAddrForm((a) => ({ ...a, fullName: e.target.value }))}
                  />
                  <Input
                    required
                    placeholder="Phone"
                    value={resolvedAddrForm.phone}
                    onChange={(e) => setAddrForm((a) => ({ ...a, phone: e.target.value }))}
                  />
                  <Input
                    required
                    placeholder="Country"
                    value={addrForm.country}
                    onChange={(e) => setAddrForm((a) => ({ ...a, country: e.target.value }))}
                  />
                  <Input
                    required
                    placeholder="City"
                    value={addrForm.city}
                    onChange={(e) => setAddrForm((a) => ({ ...a, city: e.target.value }))}
                  />
                  <Input
                    required
                    placeholder="Postal Code"
                    value={addrForm.postalCode}
                    onChange={(e) => setAddrForm((a) => ({ ...a, postalCode: e.target.value }))}
                  />
                </div>
                <Input
                  required
                  placeholder="Street Address"
                  value={addrForm.address}
                  onChange={(e) => setAddrForm((a) => ({ ...a, address: e.target.value }))}
                />
                <Button type="submit">Save Address</Button>
              </form>
            </div>
          )}

          {tab === 'settings' && user && (
            <div className="space-y-6 max-w-xl">
              {activeConfig.enableDarkTheme && activeConfig.enableLightTheme && (
                <div className="rounded-theme-card border border-line-subtle bg-surface-card p-6 space-y-4 shadow-theme-card">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink-primary">Display Theme</h2>
                    <p className="text-xs text-ink-secondary mt-1">
                      Choose your preferred interface theme across all SONIQ pages.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'system', label: 'System', icon: Monitor },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPreference(opt.id)}
                        className={`flex items-center justify-center gap-2 rounded-theme-control border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                          preference === opt.id
                            ? 'border-accent-primary bg-accent-primary/15 text-accent-primary'
                            : 'border-line-subtle bg-surface-secondary text-ink-secondary hover:text-ink-primary'
                        }`}
                      >
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form
                onSubmit={handleChangePassword}
                className="rounded-theme-card border border-line-subtle bg-surface-card p-6 sm:p-8 space-y-5 shadow-theme-card"
              >
                <h2 className="font-display text-xl font-semibold text-ink-primary">Change Password</h2>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">Current Password</label>
                  <Input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-secondary mb-1.5">New Password (min 8 chars)</label>
                  <Input
                    type="password"
                    required
                    minLength={8}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  />
                </div>
                <Button type="submit">Update Password</Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <StorefrontShell>
      <Suspense fallback={<div className="mx-auto max-w-7xl px-6 py-20 text-ink-secondary">Loading account...</div>}>
        <AccountContent />
      </Suspense>
    </StorefrontShell>
  );
}
