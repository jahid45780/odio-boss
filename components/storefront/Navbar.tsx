'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import type { WebsiteSettings } from '@/lib/types';
import { DEFAULT_NAVIGATION_CONFIG } from '@/lib/cms-defaults';
import { cn } from '@/lib/utils';
import { SafeImage } from '@/components/ui/safe-image';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  settings?: WebsiteSettings;
}

const emptySubscribe = () => () => {};

export function Navbar({ settings }: NavbarProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const setSearchOpen = useStore((s) => s.setSearchOpen);

  const cartCount = mounted ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const wishlistCount = mounted ? wishlist.length : 0;

  const { data: authData } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      try {
        const res = await api.get('/auth/me');
        return res.data.data.user;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const handleLogout = async () => {
    await api.post('/auth/logout');
    queryClient.setQueryData(['auth-me'], null);
    setAccountOpen(false);
  };

  const navConfig = settings?.navigationConfig || DEFAULT_NAVIGATION_CONFIG;
  const navLinks = [...(navConfig.links || DEFAULT_NAVIGATION_CONFIG.links)]
    .filter((l) => l.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const showAnnouncement =
    !announcementDismissed &&
    settings?.announcementActive &&
    Boolean(settings?.announcementText);

  const headerStyleClass =
    navConfig.headerStyle === 'solid'
      ? 'bg-surface-primary'
      : navConfig.headerStyle === 'transparent'
      ? 'bg-surface-primary/70 backdrop-blur-md'
      : 'bg-surface-primary/90 backdrop-blur-md';

  return (
    <div className={cn(navConfig.stickyHeader !== false ? 'sticky top-0 z-40' : 'relative z-40', 'w-full')}>
      {showAnnouncement && (
        <div className="hidden sm:flex items-center justify-center relative bg-surface-secondary border-b border-line-subtle px-10 h-9 text-xs text-ink-secondary">
          <p className="truncate max-w-4xl text-center">{settings?.announcementText}</p>
          <button
            type="button"
            onClick={() => setAnnouncementDismissed(true)}
            aria-label="Dismiss announcement"
            className="absolute right-4 p-1 text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <header className={cn(headerStyleClass, 'border-b border-line-subtle transition-colors')}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-theme-control text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link
              href="/"
              className="flex items-center gap-2.5 font-display text-xl font-bold tracking-[0.18em] text-ink-primary whitespace-nowrap shrink-0"
            >
              {settings?.logoUrl ? (
                <span className="relative h-8 w-28 overflow-hidden block">
                  <SafeImage
                    src={settings.logoUrl}
                    alt={settings.siteName || 'SONIQ'}
                    fill
                    className="object-contain object-left"
                  />
                </span>
              ) : (
                <span>{settings?.siteName || 'SONIQ'}</span>
              )}
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.id || link.href}
                  href={link.href}
                  className={cn(
                    'relative py-1 whitespace-nowrap shrink-0 transition-colors hover:text-ink-primary',
                    isActive ? 'text-ink-primary' : 'text-ink-secondary'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search speakers"
              className="inline-flex h-10 w-10 items-center justify-center rounded-theme-control text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary transition-colors cursor-pointer"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            <ThemeToggle />

            <Link
              href="/account?tab=wishlist"
              aria-label="Wishlist"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-theme-control text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary transition-colors"
            >
              <Heart className="h-4.5 w-4.5" />
              {wishlistCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-secondary px-1 text-[10px] font-semibold text-white tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Shopping cart"
              className="relative inline-flex h-10 items-center gap-2 rounded-theme-control px-2.5 text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary transition-colors cursor-pointer"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span className="text-xs font-semibold tabular-nums text-ink-primary">{cartCount}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-label="Account menu"
                className="inline-flex h-10 items-center gap-2 rounded-theme-control border border-line-subtle bg-surface-card px-3 text-xs font-medium text-ink-primary hover:border-accent-primary/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <User className="h-4 w-4 text-accent-primary" />
                <span className="hidden sm:inline max-w-[110px] truncate">
                  {authData ? authData.name.split(' ')[0] : 'Sign In'}
                </span>
              </button>

              {accountOpen && (
                <div
                  onMouseLeave={() => setAccountOpen(false)}
                  className="absolute right-0 mt-2 w-56 rounded-theme-card border border-line-subtle bg-surface-card p-2 shadow-theme-card z-50"
                >
                  {authData ? (
                    <>
                      <div className="px-3 py-2 border-b border-line-subtle mb-1">
                        <p className="text-sm font-medium text-ink-primary truncate">{authData.name}</p>
                        <p className="text-xs text-ink-secondary truncate">{authData.email}</p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 rounded-theme-control px-3 py-2 text-sm text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary"
                      >
                        <User className="h-4 w-4" />
                        My Account
                      </Link>
                      <Link
                        href="/account?tab=orders"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 rounded-theme-control px-3 py-2 text-sm text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary"
                      >
                        <Package className="h-4 w-4" />
                        Order History
                      </Link>
                      {authData.role === 'ADMIN' && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 rounded-theme-control px-3 py-2 text-sm text-accent-primary hover:bg-accent-primary/10"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-theme-control px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 mt-1 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-theme-control px-3 py-2 text-sm text-ink-primary hover:bg-surface-elevated"
                      >
                        Customer Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-theme-control px-3 py-2 text-sm text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary"
                      >
                        Create Account
                      </Link>
                      <div className="my-1 border-t border-line-subtle" />
                      <Link
                        href="/admin/login"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 rounded-theme-control px-3 py-2 text-xs text-accent-primary hover:bg-accent-primary/10"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Admin Console
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-line-subtle bg-surface-secondary px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.id || link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-theme-control px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-line-subtle flex gap-2">
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 rounded-theme-control bg-btn-primary py-2.5 text-center text-sm font-semibold text-btn-contrast"
              >
                Explore Speakers
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
