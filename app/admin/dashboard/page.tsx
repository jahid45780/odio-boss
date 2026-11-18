'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Speaker,
  FolderTree,
  Award,
  ShoppingCart,
  Users,
  Boxes,
  TicketPercent,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { OverviewPanel } from '@/components/admin/OverviewPanel';
import { ProductsPanel } from '@/components/admin/ProductsPanel';
import { OrdersPanel } from '@/components/admin/OrdersPanel';
import { CategoriesPanel, BrandsPanel } from '@/components/admin/CatalogMetaPanels';
import { CustomersPanel, InventoryPanel } from '@/components/admin/CustomersAndInventoryPanels';
import { CouponsPanel, BannersPanel, ReviewsPanel } from '@/components/admin/MarketingAndReviewsPanels';
import { SettingsPanel } from '@/components/admin/SettingsPanel';
import { ThemeToggle } from '@/components/storefront/ThemeToggle';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Speaker },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'brands', label: 'Brands', icon: Award },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'coupons', label: 'Coupons', icon: TicketPercent },
  { id: 'banners', label: 'Banners', icon: ImageIcon },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'settings', label: 'Website Settings', icon: Settings },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: user, isLoading } = useQuery({
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

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/admin/login');
    }
  }, [isLoading, user, router]);

  const handleLogout = async () => {
    await api.post('/auth/logout');
    queryClient.setQueryData(['auth-me'], null);
    router.push('/admin/login');
  };

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-surface-primary text-ink-secondary flex items-center justify-center text-sm">
        Verifying administrator session...
      </div>
    );
  }

  const currentNav = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-surface-secondary border-r border-line-subtle p-4">
      <div>
        <div className="px-3 py-3 border-b border-line-subtle mb-4 flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold tracking-[0.18em] text-ink-primary">
            SONIQ
          </Link>
          <span className="text-[11px] font-mono text-accent-primary font-semibold">ADMIN</span>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 rounded-theme-control px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-accent-primary/15 text-accent-primary'
                  : 'text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-line-subtle space-y-2">
        <div className="px-3 py-1">
          <p className="text-xs font-medium text-ink-primary truncate">{user.name}</p>
          <p className="text-[11px] text-ink-secondary truncate">{user.email}</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-theme-control px-3 py-2 text-xs text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Live Storefront
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-theme-control px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-primary text-ink-primary flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/65" onClick={() => setMobileNavOpen(false)} />
          <div className="relative z-10 w-64 h-full">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close sidebar"
              className="absolute right-3 top-3 p-1.5 text-ink-secondary hover:text-ink-primary z-20 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-line-subtle bg-surface-primary/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden p-2 rounded-theme-control text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-ink-secondary hidden sm:inline">SONIQ Console</span>
              <span className="text-ink-secondary hidden sm:inline" aria-hidden="true">/</span>
              <h1 className="font-display text-lg font-semibold text-ink-primary truncate">
                {currentNav.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-theme-control border border-line-strong bg-surface-card px-3.5 py-2 text-xs font-medium text-ink-primary hover:border-accent-primary/60 whitespace-nowrap shrink-0 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-accent-primary" />
              Storefront
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && <OverviewPanel onNavigate={setActiveTab} />}
          {activeTab === 'products' && <ProductsPanel />}
          {activeTab === 'categories' && <CategoriesPanel />}
          {activeTab === 'brands' && <BrandsPanel />}
          {activeTab === 'orders' && <OrdersPanel />}
          {activeTab === 'customers' && <CustomersPanel />}
          {activeTab === 'inventory' && <InventoryPanel />}
          {activeTab === 'coupons' && <CouponsPanel />}
          {activeTab === 'banners' && <BannersPanel />}
          {activeTab === 'reviews' && <ReviewsPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}
