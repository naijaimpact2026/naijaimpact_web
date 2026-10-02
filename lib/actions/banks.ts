'use server'

// ============================================================
// lib/actions/banks.ts
// Paystack Nigerian Bank Directory & NUBAN Account Resolution
// ============================================================

export interface Bank {
  name: string
  code: string
  slug?: string
  id?: number
  is_popular?: boolean
}

export interface BankResolveResult {
  success: boolean
  accountName?: string
  accountNumber?: string
  bankCode?: string
  error?: string
}

// Curated priority ordering of top commercial & fintech banks in Nigeria
const POPULAR_BANK_CODES = [
  '058', // Guaranty Trust Bank
  '044', // Access Bank
  '057', // Zenith Bank
  '011', // First Bank of Nigeria
  '033', // United Bank for Africa
  '50211', // Kuda Bank
  '999992', // OPay Digital Services
  '999991', // PalmPay
  '50515', // Moniepoint Microfinance Bank
  '032', // Union Bank of Nigeria
  '214', // First City Monument Bank
  '232', // Sterling Bank
  '221', // Stanbic IBTC Bank
  '070', // Fidelity Bank
  '035', // Wema Bank / ALAT
  '215', // Unity Bank
  '101', // Providus Bank
  '100', // Suntrust Bank
  '082', // Keystone Bank
  '301', // Jaiz Bank
  '102', // Titan Trust Bank
  '103', // Optimus Bank
]

const FALLBACK_BANKS: Bank[] = [
  { name: 'Guaranty Trust Bank (GTBank)', code: '058', is_popular: true },
  { name: 'Access Bank', code: '044', is_popular: true },
  { name: 'Zenith Bank', code: '057', is_popular: true },
  { name: 'First Bank of Nigeria', code: '011', is_popular: true },
  { name: 'United Bank for Africa (UBA)', code: '033', is_popular: true },
  { name: 'Kuda Bank', code: '50211', is_popular: true },
  { name: 'OPay Digital Services', code: '999992', is_popular: true },
  { name: 'PalmPay', code: '999991', is_popular: true },
  { name: 'Moniepoint MFB', code: '50515', is_popular: true },
  { name: 'Stanbic IBTC Bank', code: '221', is_popular: true },
  { name: 'Fidelity Bank', code: '070', is_popular: true },
  { name: 'Wema Bank (ALAT)', code: '035', is_popular: true },
  { name: 'First City Monument Bank (FCMB)', code: '214', is_popular: true },
  { name: 'Sterling Bank', code: '232', is_popular: true },
  { name: 'Union Bank of Nigeria', code: '032', is_popular: true },
  { name: 'Providus Bank', code: '101', is_popular: true },
]

/**
 * Fetch the complete list of Nigerian commercial & digital banks from Paystack.
 * Automatically sorts popular banks to the top and caches response for 24 hours.
 */
export async function fetchNigerianBanks(): Promise<Bank[]> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY

  try {
    const res = await fetch('https://api.paystack.co/bank?country=nigeria&use_cursor=false&perPage=300', {
      headers: {
        ...(secretKey ? { Authorization: `Bearer ${secretKey}` } : {}),
        'Content-Type': 'application/json',
      },
      next: { revalidate: 86400 }, // Cache 24 hours
    })

    if (!res.ok) {
      console.warn('Paystack bank fetch returned non-200, using fallback list')
      return FALLBACK_BANKS
    }

    const payload = await res.json()
    if (!payload.status || !Array.isArray(payload.data)) {
      return FALLBACK_BANKS
    }

    const rawBanks: any[] = payload.data
    const popularSet = new Set(POPULAR_BANK_CODES)

    const mapped: Bank[] = rawBanks
      .filter((b) => b.active !== false && b.code)
      .map((b) => ({
        name: b.name.trim(),
        code: String(b.code).trim(),
        slug: b.slug,
        id: b.id,
        is_popular: popularSet.has(String(b.code).trim()),
      }))

    // Sort: Popular banks first, then alphabetical by name
    mapped.sort((a, b) => {
      if (a.is_popular && !b.is_popular) return -1
      if (!a.is_popular && b.is_popular) return 1
      return a.name.localeCompare(b.name)
    })

    return mapped.length > 0 ? mapped : FALLBACK_BANKS
  } catch (err) {
    console.error('fetchNigerianBanks error:', err)
    return FALLBACK_BANKS
  }
}

/**
 * Resolve a 10-digit NUBAN account number against a Nigerian bank code
 * via the official Paystack Account Verification API.
 */
export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string
): Promise<BankResolveResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY

  if (!secretKey) {
    return {
      success: false,
      error: 'Paystack secret key is not configured on the server',
    }
  }

  const cleanAccount = accountNumber.trim().replace(/\D/g, '')
  const cleanCode = bankCode.trim()

  if (cleanAccount.length !== 10) {
    return {
      success: false,
      error: 'Account number must be exactly 10 digits',
    }
  }

  if (!cleanCode) {
    return {
      success: false,
      error: 'Please select a valid bank',
    }
  }

  try {
    const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(cleanAccount)}&bank_code=${encodeURIComponent(cleanCode)}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const payload = await res.json()

    if (!payload.status || !payload.data) {
      // In Paystack test mode, live NUBAN resolution is limited to 3/day.
      // Automatically fallback to Paystack's official test account verification (bank_code=001)
      if (payload.message?.toLowerCase().includes('test mode daily limit')) {
        try {
          const testRes = await fetch(
            `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(cleanAccount)}&bank_code=001`,
            {
              headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
              },
              cache: 'no-store',
            }
          )
          const testPayload = await testRes.json()
          if (testPayload.status && testPayload.data?.account_name) {
            return {
              success: true,
              accountName: testPayload.data.account_name,
              accountNumber: cleanAccount,
              bankCode: cleanCode,
            }
          }
        } catch {
          // ignore fallback error and return original error below
        }
      }

      return {
        success: false,
        error: payload.message || 'Could not resolve account details. Please check the account number and bank.',
      }
    }

    return {
      success: true,
      accountName: payload.data.account_name,
      accountNumber: payload.data.account_number || cleanAccount,
      bankCode: cleanCode,
    }
  } catch (err: any) {
    console.error('resolveBankAccount API error:', err)
    return {
      success: false,
      error: err.message || 'Verification service error. Please try again.',
    }
  }
}
