'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentUser } from '@/lib/supabase/auth'
import { normalizeRole } from '@/lib/modushive/config'
import { StreamChat } from 'stream-chat'
import type { PinnedProduct } from '@/lib/types'

function getStreamChatServer(): StreamChat | null {
    const apiKey = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_KEY
    const apiSecret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET
    return apiKey && apiSecret ? StreamChat.getInstance(apiKey, apiSecret) : null
}

/**
 * Retrieves the current creator's active storefront items and services for live shopping pinning.
 */
export async function getCreatorStorefrontListings(): Promise<PinnedProduct[]> {
    try {
        const { authUser, profile } = await getCurrentUser()
        if (!authUser || !profile) return []

        const supabase = await createClient()

        // 1. Fetch from nm_listings
        const { data: listings } = await supabase
            .from('nm_listings')
            .select(`
                id,
                title,
                price,
                description,
                user_id,
                listing_images:nm_listing_images(image_url, sort_order)
            `)
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .limit(30)

        const products: PinnedProduct[] = []

        if (listings && listings.length > 0) {
            for (const item of listings) {
                const images = (item.listing_images ?? [])
                    .sort((a: any, b: any) => a.sort_order - b.sort_order)
                    .map((i: any) => i.image_url)

                products.push({
                    id: item.id,
                    title: item.title,
                    price: Number(item.price ?? 0),
                    description: item.description ?? undefined,
                    cover_image_url: images[0] || null,
                    seller_id: item.user_id,
                    seller_name: profile.display_name || profile.username || 'Creator',
                    delivery_options: ['pickup', 'delivery'],
                })
            }
        }

        // 2. Also fetch user's active services/consultations
        const { data: services } = await supabase
            .from('services')
            .select('id, title, description, cover_url, pricing_tiers')
            .eq('provider_id', profile.id)
            .eq('active', true)
            .limit(10)

        if (services && services.length > 0) {
            for (const s of services) {
                const tiers = s.pricing_tiers as any[] | null
                const price = tiers && tiers.length > 0 ? Number(tiers[0].price ?? 0) : 0
                products.push({
                    id: s.id,
                    title: s.title,
                    price,
                    description: s.description ?? undefined,
                    cover_image_url: s.cover_url || null,
                    seller_id: profile.id,
                    seller_name: profile.display_name || profile.username || 'Creator',
                    delivery_options: ['digital'],
                })
            }
        }

        return products
    } catch (err) {
        console.error('getCreatorStorefrontListings error:', err)
        return []
    }
}

/**
 * Pins a product or service to a live stream broadcast in real-time.
 */
export async function pinStreamProduct(input: {
    liveStreamId: string
    product: PinnedProduct
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { profile } = await getCurrentUser()
        if (!profile) return { success: false, error: 'Unauthorized' }

        const serviceDb = createServiceClient()

        // Verify caller is host or admin
        const { data: stream } = await serviceDb
            .from('live_streams')
            .select('id, host_id, chat_channel_id')
            .eq('id', input.liveStreamId)
            .maybeSingle()

        if (!stream) return { success: false, error: 'Stream not found' }
        if (stream.host_id !== profile.id && normalizeRole(profile.role) !== 'admin') {
            return { success: false, error: 'Only the broadcast host can pin products' }
        }

        // Update live_streams with pinned product
        const { error } = await serviceDb
            .from('live_streams')
            .update({
                pinned_product_id: input.product.id,
                pinned_product_data: input.product,
            })
            .eq('id', input.liveStreamId)

        if (error) {
            console.error('Failed to pin product:', error)
            return { success: false, error: 'Failed to pin product' }
        }

        // Broadcast announcement to live chat channel
        if (stream.chat_channel_id) {
            try {
                const chat = getStreamChatServer()
                if (chat) {
                    const channel = chat.channel('livestream', stream.chat_channel_id)
                    await channel.sendMessage({
                        text: `🛍️ Pinned Item: ${input.product.title} • ₦${Number(input.product.price).toLocaleString('en-NG')}`,
                        user_id: profile.id,
                        pinned_item: {
                            id: input.product.id,
                            title: input.product.title,
                            price: input.product.price,
                            cover_image_url: input.product.cover_image_url,
                        },
                    } as any)
                }
            } catch (chatErr) {
                console.error('Stream chat pin announcement failed (non-blocking):', chatErr)
            }
        }

        revalidatePath(`/app/modushive/live/${input.liveStreamId}`)
        revalidatePath('/app/modushive/studio')

        return { success: true }
    } catch (err: any) {
        console.error('pinStreamProduct error:', err)
        return { success: false, error: err.message || 'Could not pin product' }
    }
}

/**
 * Removes the currently pinned product from a live stream.
 */
export async function unpinStreamProduct(liveStreamId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { profile } = await getCurrentUser()
        if (!profile) return { success: false, error: 'Unauthorized' }

        const serviceDb = createServiceClient()

        const { data: stream } = await serviceDb
            .from('live_streams')
            .select('id, host_id')
            .eq('id', liveStreamId)
            .maybeSingle()

        if (!stream) return { success: false, error: 'Stream not found' }
        if (stream.host_id !== profile.id && normalizeRole(profile.role) !== 'admin') {
            return { success: false, error: 'Only the broadcast host can unpin products' }
        }

        const { error } = await serviceDb
            .from('live_streams')
            .update({
                pinned_product_id: null,
                pinned_product_data: null,
            })
            .eq('id', liveStreamId)

        if (error) return { success: false, error: 'Failed to unpin product' }

        revalidatePath(`/app/modushive/live/${liveStreamId}`)
        revalidatePath('/app/modushive/studio')

        return { success: true }
    } catch (err: any) {
        console.error('unpinStreamProduct error:', err)
        return { success: false, error: err.message || 'Could not unpin product' }
    }
}

/**
 * Purchases a pinned product live during a broadcast.
 * Implements the 92/8 creator revenue split per the Day-One Marketplace Blueprint:
 * - 92% net earnings credited to creator's wallet
 * - 8% platform fee
 * - Itemized under route_key: 'marketplace' in creator_stream_transactions
 */
export async function purchasePinnedProduct(input: {
    liveStreamId: string
    productId: string
    quantity: number
    deliveryOption: string
    deliveryAddress?: string
    paymentMethod: 'wallet' | 'paystack'
    paystackReference?: string
}): Promise<{
    success: boolean
    error?: string
    sale?: {
        id: string
        productTitle: string
        totalAmount: number
        reference: string
    }
}> {
    try {
        const { authUser, profile } = await getCurrentUser()
        if (!authUser || !profile) {
            return { success: false, error: 'Please sign in to complete your purchase.' }
        }

        const supabase = await createClient()

        // 1. Fetch stream and pinned product details
        const { data: stream } = await supabase
            .from('live_streams')
            .select('id, title, host_id, pinned_product_data, chat_channel_id')
            .eq('id', input.liveStreamId)
            .maybeSingle()

        if (!stream) {
            return { success: false, error: 'Live stream not found.' }
        }

        if (profile.id === stream.host_id) {
            return { success: false, error: 'You cannot buy products from your own broadcast.' }
        }

        const pinnedData = stream.pinned_product_data as PinnedProduct | null
        if (!pinnedData || pinnedData.id !== input.productId) {
            return { success: false, error: 'This item is no longer featured on the stream.' }
        }

        const qty = Math.max(1, input.quantity || 1)
        const unitPrice = Number(pinnedData.price ?? 0)
        const totalAmount = unitPrice * qty

        if (totalAmount <= 0) {
            return { success: false, error: 'Invalid product price.' }
        }

        // 2. Deduct from Hubnovo Wallet if selected
        if (input.paymentMethod === 'wallet') {
            const { data: buyerWallet } = await supabase
                .from('user_wallet')
                .select('id, balance')
                .eq('user_id', profile.id)
                .maybeSingle()

            const currentBalance = Number(buyerWallet?.balance ?? 0)
            if (currentBalance < totalAmount) {
                return {
                    success: false,
                    error: `Insufficient wallet balance (₦${currentBalance.toLocaleString('en-NG')}). Please top up your wallet or pay with card.`,
                }
            }

            await supabase
                .from('user_wallet')
                .update({ balance: currentBalance - totalAmount, updated_at: new Date().toISOString() })
                .eq('id', buyerWallet!.id)
        }

        // 3. Compute 92/8 revenue split
        const platformFee = Math.round(totalAmount * 0.08 * 100) / 100 // 8% platform fee
        const creatorNet = totalAmount - platformFee // 92% net to creator

        // 4. Credit creator's wallet
        const { data: creatorWallet } = await supabase
            .from('user_wallet')
            .select('id, balance')
            .eq('user_id', stream.host_id)
            .maybeSingle()

        if (creatorWallet) {
            const newCreatorBalance = Number(creatorWallet.balance ?? 0) + creatorNet
            await supabase
                .from('user_wallet')
                .update({ balance: newCreatorBalance, updated_at: new Date().toISOString() })
                .eq('id', creatorWallet.id)
        } else {
            await supabase.from('user_wallet').insert({
                user_id: stream.host_id,
                balance: creatorNet,
            })
        }

        // 5. Generate reference and record in live_stream_sales
        const reference = input.paystackReference || `SHOP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        const buyerName = profile.display_name || profile.username || 'Live Shopper'

        const serviceClient = createServiceClient()
        const { data: newSale, error: saleErr } = await serviceClient
            .from('live_stream_sales')
            .insert({
                live_stream_id: stream.id,
                product_id: pinnedData.id,
                buyer_id: profile.id,
                creator_id: stream.host_id,
                product_title: pinnedData.title,
                product_price: unitPrice,
                quantity: qty,
                total_amount: totalAmount,
                payment_method: input.paymentMethod,
                payment_reference: reference,
                delivery_option: input.deliveryOption,
                delivery_address: input.deliveryAddress || null,
            })
            .select('id')
            .single()

        if (saleErr) {
            console.error('Failed to log live_stream_sales:', saleErr)
        }

        // 6. Record transaction in creator_stream_transactions
        try {
            await serviceClient.from('creator_stream_transactions').insert({
                creator_id: stream.host_id,
                payer_id: profile.id,
                payer_name: buyerName,
                live_stream_id: stream.id,
                title: `Live Order: ${pinnedData.title} (x${qty})`,
                route_key: 'marketplace',
                type: 'marketplace_sale',
                gross_amount: totalAmount,
                payment_cost: 0,
                platform_fee: platformFee,
                net_amount: creatorNet,
                status: 'settled',
                reference,
                notes: `Delivery: ${input.deliveryOption}${input.deliveryAddress ? ` to ${input.deliveryAddress}` : ''}`,
            })
        } catch (dbErr) {
            console.error('Failed to log creator marketplace transaction:', dbErr)
        }

        // 7. Drop celebratory purchase notice into stream chat
        if (stream.chat_channel_id) {
            try {
                const chat = getStreamChatServer()
                if (chat) {
                    const channel = chat.channel('livestream', stream.chat_channel_id)
                    await channel.sendMessage({
                        text: `🎉 ${buyerName} just purchased ${pinnedData.title} live!`,
                        user_id: profile.id,
                        order_celebration: {
                            buyer: buyerName,
                            item: pinnedData.title,
                            amount: totalAmount,
                        },
                    } as any)
                }
            } catch (chatErr) {
                console.error('Stream chat purchase celebration notice failed (non-blocking):', chatErr)
            }
        }

        revalidatePath('/app/modushive/earnings')
        revalidatePath(`/app/modushive/live/${stream.id}`)
        revalidatePath('/app/wallet')
        revalidatePath('/app/market/orders')

        return {
            success: true,
            sale: {
                id: newSale?.id || reference,
                productTitle: pinnedData.title,
                totalAmount,
                reference,
            },
        }
    } catch (err: any) {
        console.error('purchasePinnedProduct error:', err)
        return { success: false, error: err.message || 'Failed to complete live purchase.' }
    }
}
