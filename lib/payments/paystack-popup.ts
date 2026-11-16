'use client'

// Browser-side Paystack inline checkout (v1 script).
//
// Use openPaystack() instead of calling window.PaystackPop.setup directly:
//  - The v1 script only calls `callback` on success. It never calls
//    `onSuccess` (that name belongs to the v2 script), so a payment made with
//    an `onSuccess` handler is charged but never verified.
//  - v1 also rejects async functions as `callback`, so the handlers are
//    wrapped in plain functions here.
//  - The script is loaded on demand, so a click doesn't fail just because a
//    <Script strategy="lazyOnload"> tag hasn't finished loading yet.

const SRC = 'https://js.paystack.co/v1/inline.js'
const LOAD_TIMEOUT_MS = 15_000

let loading: Promise<void> | null = null

/** Load the Paystack inline script once. Resolves when window.PaystackPop exists. */
export function loadPaystack(): Promise<void>
{
    if (typeof window === 'undefined') return Promise.reject(new Error('Paystack can only open in the browser'))
    if (window.PaystackPop) return Promise.resolve()

    if (!loading)
    {
        loading = new Promise<void>((resolve, reject) =>
        {
            const fail = () =>
            {
                loading = null
                reject(new Error('Could not load Paystack. Check your connection and try again.'))
            }
            const timer = window.setTimeout(fail, LOAD_TIMEOUT_MS)
            const done = () =>
            {
                window.clearTimeout(timer)
                if (window.PaystackPop) resolve()
                else fail()
            }

            const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`)
            const script = existing ?? document.createElement('script')
            script.addEventListener('load', done)
            script.addEventListener('error', () => { window.clearTimeout(timer); fail() })
            if (!existing)
            {
                script.src = SRC
                script.async = true
                document.head.appendChild(script)
            }
        })
    }
    return loading
}

export interface OpenPaystackOptions
{
    email: string
    amountKobo: number
    reference: string
    metadata?: Record<string, unknown>
    /** Called once Paystack reports the charge succeeded. Verify on the server here. */
    onSuccess: (reference: string) => void | Promise<void>
    /** Called when the popup closes without a success callback. */
    onClose?: () => void
}

/** Open the Paystack popup. Throws if the key is missing or the script can't load. */
export async function openPaystack(opts: OpenPaystackOptions): Promise<void>
{
    const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!key) throw new Error('Payment configuration error: missing Paystack public key')

    await loadPaystack()

    let succeeded = false
    const handler = window.PaystackPop!.setup({
        key,
        email: opts.email,
        amount: opts.amountKobo,
        currency: 'NGN',
        ref: opts.reference,
        metadata: opts.metadata,
        callback: function (response)
        {
            succeeded = true
            void Promise.resolve(opts.onSuccess(response?.reference || opts.reference)).catch((err) =>
                console.error('Paystack onSuccess handler failed:', err)
            )
        },
        onClose: function ()
        {
            // v1 can fire onClose after callback; only report a real cancel.
            if (!succeeded) opts.onClose?.()
        },
    })
    handler.openIframe()
}
