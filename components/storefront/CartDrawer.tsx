'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/format';
import { SafeImage } from '@/components/ui/safe-image';
import { Button } from '@/components/ui/button';
import type { WebsiteSettings } from '@/lib/types';

interface CartDrawerProps {
  settings?: WebsiteSettings;
}

export function CartDrawer({ settings }: CartDrawerProps) {
  const isCartOpen = useStore((s) => s.isCartOpen);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);

  const symbol = settings?.currencySymbol || '$';
  const freeThreshold = settings?.freeShippingThreshold ?? 500;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const remainingForFree = Math.max(0, freeThreshold - subtotal);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-line-subtle bg-surface-secondary text-ink-primary shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-line-subtle px-6 py-5">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5 text-accent-primary" />
                <h2 className="font-display text-lg font-semibold">Your Bag</h2>
                <span className="text-xs text-ink-secondary tabular-nums">
                  ({cart.reduce((s, i) => s + i.quantity, 0)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart drawer"
                className="rounded-theme-control p-2 text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {cart.length > 0 && (
              <div className="border-b border-line-subtle bg-surface-card px-6 py-3 text-xs text-ink-secondary">
                {remainingForFree === 0 ? (
                  <span className="text-accent-primary font-medium">
                    Complimentary insured courier delivery unlocked.
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-ink-primary tabular-nums">{formatCurrency(remainingForFree, symbol)}</strong> more for complimentary insured delivery.
                  </span>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-ink-secondary/40 mb-4" />
                  <p className="font-display text-lg font-medium text-ink-primary">Your bag is empty</p>
                  <p className="mt-1 text-sm text-ink-secondary max-w-xs">
                    Explore our reference towers, studio monitors, and portable acoustic systems.
                  </p>
                  <Button asChild className="mt-6" onClick={() => setCartOpen(false)}>
                    <Link href="/shop">Explore Collection</Link>
                  </Button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-4 rounded-theme-card border border-line-subtle bg-surface-card p-3.5"
                  >
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => setCartOpen(false)}
                      className="relative h-20 w-24 shrink-0 overflow-hidden rounded-theme-control bg-surface-elevated"
                    >
                      <SafeImage src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </Link>
                    <div className="flex flex-1 flex-col min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setCartOpen(false)}
                          className="text-sm font-semibold text-ink-primary hover:text-accent-primary truncate"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          aria-label={`Remove ${item.name}`}
                          className="text-ink-secondary hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-ink-secondary mt-0.5">{item.brandName}</p>
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-theme-control border border-line-strong bg-surface-primary">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                            className="p-1.5 text-ink-secondary hover:text-ink-primary disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-medium text-ink-primary tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            aria-label="Increase quantity"
                            className="p-1.5 text-ink-secondary hover:text-ink-primary disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-ink-primary tabular-nums">
                          {formatCurrency(item.price * item.quantity, symbol)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-line-subtle bg-surface-primary p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-secondary">Subtotal</span>
                  <span className="font-display text-lg font-semibold text-ink-primary tabular-nums">
                    {formatCurrency(subtotal, symbol)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" asChild onClick={() => setCartOpen(false)}>
                    <Link href="/cart">View Bag</Link>
                  </Button>
                  <Button asChild onClick={() => setCartOpen(false)}>
                    <Link href="/checkout">Checkout</Link>
                  </Button>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
