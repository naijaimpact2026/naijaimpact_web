'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Script from 'next/script'

export interface CartItem
{
    listingId: string
    title: string
    price: number
    image: string | null
    sellerId: string
    sellerName: string
    stock: number
    quantity: number
}

interface MarketCartContextValue
{
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
    removeItem: (listingId: string) => void
    updateQuantity: (listingId: string, quantity: number) => void
    clear: () => void
    subtotal: number
    count: number
}

const MarketCartContext = createContext<MarketCartContextValue | null>(null)

const STORAGE_KEY = 'hubnovo_market_cart'

function readStoredCart(): CartItem[]
{
    if (typeof window === 'undefined') return []
    try
    {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    }
    catch
    {
        return []
    }
}

export function MarketCartProvider({ children }: { children: React.ReactNode })
{
    const [items, setItems] = useState<CartItem[]>([])
    const [hydrated, setHydrated] = useState(false)

    // Cart lives in this browser only — read it once after mount to avoid an
    // SSR/client markup mismatch (server render always starts from an empty cart).
    useEffect(() =>
    {
        setItems(readStoredCart())
        setHydrated(true)
    }, [])

    useEffect(() =>
    {
        if (!hydrated) return
        try
        {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        }
        catch { /* private-browsing / storage full — cart just won't persist */ }
    }, [items, hydrated])

    const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) =>
    {
        setItems((prev) =>
        {
            const existing = prev.find((i) => i.listingId === item.listingId)
            if (existing)
            {
                const nextQty = Math.min(existing.stock, existing.quantity + quantity)
                return prev.map((i) => i.listingId === item.listingId ? { ...i, quantity: nextQty } : i)
            }
            return [...prev, { ...item, quantity: Math.min(item.stock, Math.max(1, quantity)) }]
        })
    }, [])

    const removeItem = useCallback((listingId: string) =>
    {
        setItems((prev) => prev.filter((i) => i.listingId !== listingId))
    }, [])

    const updateQuantity = useCallback((listingId: string, quantity: number) =>
    {
        setItems((prev) => prev.map((i) =>
        {
            if (i.listingId !== listingId) return i
            return { ...i, quantity: Math.max(1, Math.min(i.stock, quantity)) }
        }))
    }, [])

    const clear = useCallback(() => setItems([]), [])

    const subtotal = useMemo(
        () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        [items]
    )
    const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])

    const value = useMemo<MarketCartContextValue>(
        () => ({ items, addItem, removeItem, updateQuantity, clear, subtotal, count }),
        [items, addItem, removeItem, updateQuantity, clear, subtotal, count]
    )

    return (
        <MarketCartContext.Provider value={value}>
            {children}
            <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
        </MarketCartContext.Provider>
    )
}

export function useMarketCart(): MarketCartContextValue
{
    const ctx = useContext(MarketCartContext)
    if (!ctx) throw new Error('useMarketCart must be used within MarketCartProvider')
    return ctx
}
