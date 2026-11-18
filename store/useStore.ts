'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/types';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brandName: string;
  sku: string;
  price: number;
  imageUrl: string;
  quantity: number;
  maxStock: number;
}

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  brandName: string;
  price: number;
  imageUrl: string;
  stock: number;
}

interface StoreState {
  cart: CartItem[];
  wishlist: WishlistItem[];
  isCartOpen: boolean;
  isSearchOpen: boolean;
  quickViewProduct: Product | null;
  couponCode: string;

  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setQuickViewProduct: (product: Product | null) => void;
  setCouponCode: (code: string) => void;

  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  toggleWishlist: (product: Product) => boolean;
  isWishlisted: (productId: string) => boolean;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      isCartOpen: false,
      isSearchOpen: false,
      quickViewProduct: null,
      couponCode: '',

      setCartOpen: (open) => set({ isCartOpen: open }),
      setSearchOpen: (open) => set({ isSearchOpen: open }),
      setQuickViewProduct: (product) => set({ quickViewProduct: product }),
      setCouponCode: (code) => set({ couponCode: code }),

      addToCart: (product, quantity = 1) => {
        if (product.stock <= 0) return;
        const current = get().cart;
        const existing = current.find((item) => item.productId === product.id);
        if (existing) {
          const nextQty = Math.min(product.stock, existing.quantity + quantity);
          set({
            cart: current.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: nextQty, maxStock: product.stock, price: product.price }
                : item
            ),
            isCartOpen: true,
          });
        } else {
          const nextItem: CartItem = {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brandName: product.brandName || 'SONIQ',
            sku: product.sku,
            price: product.price,
            imageUrl: product.images[0] || '/images/hero-flagship.jpg',
            quantity: Math.min(product.stock, Math.max(1, quantity)),
            maxStock: product.stock,
          };
          set({ cart: [...current, nextItem], isCartOpen: true });
        }
      },

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cart: state.cart
            .map((item) => {
              if (item.productId !== productId) return item;
              const clamped = Math.max(1, Math.min(item.maxStock, quantity));
              return { ...item, quantity: clamped };
            }),
        })),

      clearCart: () => set({ cart: [], couponCode: '' }),

      toggleWishlist: (product) => {
        const exists = get().wishlist.some((w) => w.productId === product.id);
        if (exists) {
          set((state) => ({
            wishlist: state.wishlist.filter((w) => w.productId !== product.id),
          }));
          return false;
        } else {
          set((state) => ({
            wishlist: [
              ...state.wishlist,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                brandName: product.brandName || 'SONIQ',
                price: product.price,
                imageUrl: product.images[0] || '/images/hero-flagship.jpg',
                stock: product.stock,
              },
            ],
          }));
          return true;
        }
      },

      isWishlisted: (productId) => get().wishlist.some((w) => w.productId === productId),
    }),
    {
      name: 'soniq-store-v1',
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        couponCode: state.couponCode,
      }),
    }
  )
);
