import { createServiceClient } from '@/lib/supabase/service'
import { checkWalletPin, hasWalletPin, PIN_LOCKED, setWalletPin } from '@/lib/wallet-pin'
import { rateLimit, RATE_LIMITED } from '@/lib/rate-limit'
import { paystackInitialize, paystackVerify } from '@/lib/payments/paystack'
import { settleSuccessfulCharge } from '@/lib/payments/settle'
import { bankNameForCode, listNigerianBanks, resolveNuban, type Bank } from './banks'
import type { Transaction, User, Wallet } from '@/lib/types'

/*
 * Wallet core — server-side only (NOT a 'use server' module, so nothing here
 * is callable from the browser). Every function takes the caller's profile
 * explicitly. The web server actions (lib/actions/wallet.ts, banks.ts,
 * payments.ts) resolve the profile from cookies; the mobile REST API
 * (app/api/wallet, app/api/banks, app/api/users/lookup) resolves it from the
 * bearer token. Both call these functions, so PIN lockout, rate limits and
 * settlement are the same code on both.
 *
 * All amounts are naira. user_wallet.balance is the only balance.
 *
 * Failures carry an HTTP status for the REST API (400 unless stated).
 */

export type WalletResult<T = object> = ({ ok: true } & T) | { ok: false; error: string; status: number }

const fail = (error: string, status = 400): { ok: false; error: string; status: number } => ({ ok: false, error, status })
const rateLimited = () => fail(RATE_LIMITED, 429)
/** PIN failures: lockout is 429, everything else 400. */
const pinFail = (error: string) => fail(error, error === PIN_LOCKED ? 429 : 400)

type Db = ReturnType<typeof createServiceClient>

export const MIN_DEPOSIT = 100
export const MAX_DEPOSIT = 10_000_000
export const MIN_TRANSFER = 50
export const MIN_WITHDRAWAL = 100

const isAmount = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0
const newRef = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`

// ─────────────────────────────────────────────
// Wallet + history
// ─────────────────────────────────────────────

/** Get or create the wallet row for a users.id. Writes go through the service client only. */
export async function getOrCreateWallet(db: Db, userId: string): Promise<Wallet> {
  const { data: wallet } = await db.from('user_wallet').select('*').eq('user_id', userId).maybeSingle()
  if (wallet) return { ...wallet, balance: Number(wallet.balance ?? 0) } as Wallet

  const { data: created, error } = await db
    .from('user_wallet')
    .upsert({ user_id: userId, balance: 0 }, { onConflict: 'user_id', ignoreDuplicates: true })
    .select('*')
    .maybeSingle()
  if (created) return { ...created, balance: Number(created.balance ?? 0) } as Wallet

  // Lost a race with a concurrent create (or the new-user trigger): read it back.
  const { data: again } = await db.from('user_wallet').select('*').eq('user_id', userId).maybeSingle()
  if (again) return { ...again, balance: Number(again.balance ?? 0) } as Wallet

  console.error('getOrCreateWallet insert error:', error)
  throw new Error('Failed to create wallet')
}

/** The caller's wallet and their latest `limit` ledger rows (newest first). */
export async function getWallet(profile: User, limit = 10): Promise<{ wallet: Wallet; transactions: Transaction[] }> {
  const db = createServiceClient()
  const [wallet, { data: transactions }] = await Promise.all([
    getOrCreateWallet(db, profile.id),
    db
      .from('transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])
  return { wallet, transactions: (transactions ?? []) as Transaction[] }
}

export interface PublicUserCard {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
}

export interface WalletTransactionView {
  id: string
  type: string
  amount: number
  status: string
  reference: string | null
  description: string
  createdAt: string
  counterparty?: PublicUserCard
}

const TX_LABELS: Record<string, string> = {
  deposit: 'Added money',
  topup: 'Added money',
  withdrawal: 'Withdrawal',
  transfer_debit: 'Sent',
  transfer: 'Sent',
  transfer_credit: 'Received',
  receive: 'Received',
  escrow_hold: 'Paid into escrow',
  escrow_release: 'Job payment received',
  escrow_refund: 'Escrow refund',
  marketplace_purchase: 'Marketplace order',
  course_purchase: 'Course',
  course_sale: 'Course sale',
  campaign_donation: 'Donation',
  campaign_payout: 'Campaign payout',
  loan_disbursement: 'Loan',
  loan_repayment: 'Loan repayment',
  insurance_premium: 'Insurance',
  ajo_contribution: 'Ajo contribution',
  ajo_payout: 'Ajo payout',
  savings_topup: 'Savings',
  savings_withdrawal: 'Savings withdrawal',
}

const USER_CARD_COLUMNS = 'id, username, display_name, avatar_url, profile_image_url'

type UserCardRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  profile_image_url: string | null
}

const toCard = (u: UserCardRow): PublicUserCard => ({
  id: u.id,
  username: u.username,
  displayName: u.display_name,
  avatarUrl: u.avatar_url ?? u.profile_image_url ?? null,
})

/** The ledger also holds older app-wallet types (topup, transfer, receive, …). */
type LedgerRow = Omit<Transaction, 'type'> & {
  type: string
  other_user_id?: string | null
  bank_name?: string | null
  account_number?: string | null
}

function describe(tx: LedgerRow, other?: PublicUserCard): string {
  const label = TX_LABELS[tx.type] ?? tx.type.replace(/_/g, ' ')
  const who = other ? (other.username ? `@${other.username}` : other.displayName) : null
  if (who && (tx.type === 'transfer_debit' || tx.type === 'transfer')) return `Sent to ${who}`
  if (who && (tx.type === 'transfer_credit' || tx.type === 'receive')) return `Received from ${who}`
  if (tx.type === 'withdrawal' && tx.bank_name) {
    const last4 = tx.account_number ? ` ••${String(tx.account_number).slice(-4)}` : ''
    return `Withdrawal to ${tx.bank_name}${last4}`
  }
  return label
}

/** REST shape of the wallet: balance plus history with the other party of each transfer. */
export async function getWalletView(
  profile: User,
  limit = 50
): Promise<{ balance: number; transactions: WalletTransactionView[] }> {
  const { wallet, transactions } = await getWallet(profile, limit)
  const rows = transactions as LedgerRow[]

  const otherIds = Array.from(new Set(rows.map((t) => t.other_user_id).filter((id): id is string => !!id)))
  const cards = new Map<string, PublicUserCard>()
  if (otherIds.length) {
    const { data } = await createServiceClient().from('users').select(USER_CARD_COLUMNS).in('id', otherIds)
    for (const u of (data ?? []) as UserCardRow[]) cards.set(u.id, toCard(u))
  }

  return {
    balance: wallet.balance,
    transactions: rows.map((t) => {
      const counterparty = t.other_user_id ? cards.get(t.other_user_id) : undefined
      return {
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        status: t.status,
        reference: t.ref ?? null,
        description: describe(t, counterparty),
        createdAt: t.created_at,
        ...(counterparty ? { counterparty } : {}),
      }
    }),
  }
}

// ─────────────────────────────────────────────
// Deposits (Paystack)
// ─────────────────────────────────────────────

/**
 * Record a deposit intent (reference + amount) before checkout opens. That
 * record is what lets the reconcile cron recover a payment whose webhook
 * never arrived.
 */
export async function startDeposit(
  profile: User,
  email: string,
  amountNGN: number
): Promise<WalletResult<{ reference: string; amountKobo: number; email: string; userId: string }>> {
  if (!email) return fail('Your account has no email address. Add one to deposit.')
  if (!Number.isFinite(amountNGN) || amountNGN < MIN_DEPOSIT || amountNGN > MAX_DEPOSIT) {
    return fail(`Deposit must be between ₦${MIN_DEPOSIT} and ₦${MAX_DEPOSIT.toLocaleString()}.`)
  }
  if (!(await rateLimit(`checkout:${profile.id}`, 20, 600))) return rateLimited()

  const reference = newRef('DEP')
  const amountKobo = Math.round(amountNGN * 100)
  const { error } = await createServiceClient()
    .from('payment_intents')
    .insert({ reference, user_id: profile.id, purpose: 'deposit', amount_kobo: amountKobo })
  if (error) {
    console.error('startDeposit intent error:', error)
    return fail('Could not start payment. Please try again.', 503)
  }
  return { ok: true, reference, amountKobo, email, userId: profile.id }
}

/**
 * startDeposit, then open a hosted Paystack checkout for it (mobile). Paystack
 * redirects to `callbackUrl` when the customer finishes; the app should then
 * call verifyDeposit with the reference.
 */
export async function startHostedDeposit(
  profile: User,
  email: string,
  amountNGN: number,
  callbackUrl: string
): Promise<WalletResult<{ reference: string; authorizationUrl: string }>> {
  const intent = await startDeposit(profile, email, amountNGN)
  if (!intent.ok) return intent

  const init = await paystackInitialize({
    reference: intent.reference,
    email: intent.email,
    amountKobo: intent.amountKobo,
    callbackUrl,
    metadata: { type: 'deposit', userId: profile.id },
  })
  if (!init.ok) {
    console.error('startHostedDeposit initialize error:', init.message)
    return fail('Could not open the payment page. Please try again.', init.unavailable ? 503 : 400)
  }
  return { ok: true, reference: intent.reference, authorizationUrl: init.authorizationUrl }
}

const PENDING_PAYSTACK = new Set(['abandoned', 'ongoing', 'pending', 'processing', 'queued'])

export type DepositCheck =
  | { status: 'success'; reference: string; amount: number; newBalance: number; alreadyProcessed: boolean }
  | { status: 'pending' | 'failed'; reference: string; message: string }

/**
 * Verify a deposit with Paystack and credit it exactly once, through the same
 * settlement code as the webhook and the reconcile cron. Also "recover my
 * deposit" by reference. The payment must have been made with `email`.
 */
export async function verifyDeposit(profile: User, email: string, reference: string): Promise<WalletResult<DepositCheck>> {
  const cleanRef = String(reference ?? '').trim()
  if (!cleanRef) return fail('A valid transaction reference is required')
  if (!(await rateLimit(`deposit-verify:${profile.id}`, 20, 600))) return rateLimited()

  const verified = await paystackVerify(cleanRef)
  if (!verified.ok) {
    if (verified.notFound) return fail('Transaction not found on Paystack', 404)
    return fail(verified.message, 503)
  }

  const { tx } = verified
  if (tx.status !== 'success') {
    const message = tx.gateway_response || `Payment status is ${tx.status}`
    return { ok: true, status: PENDING_PAYSTACK.has(tx.status) ? 'pending' : 'failed', reference: cleanRef, message }
  }

  const payerEmail = String(tx.customer?.email ?? '').trim().toLowerCase()
  if (!payerEmail || payerEmail !== email.trim().toLowerCase()) {
    return fail('This payment was not made from your account.', 403)
  }

  const db = createServiceClient()
  const result = await settleSuccessfulCharge(db, tx, { legacyDepositUserId: profile.id })

  if (result.outcome === 'error') return fail('Failed to credit wallet balance. Please try again shortly.', 503)
  if (result.outcome === 'needs_review') {
    return {
      ok: true,
      status: 'pending',
      reference: cleanRef,
      message: 'We received this payment but need to check it. Our team will follow up.',
    }
  }
  if (result.purpose !== 'deposit' || result.userId !== profile.id) {
    return fail('This payment is not a wallet deposit from your account.', 403)
  }

  const wallet = await getOrCreateWallet(db, profile.id)
  return {
    ok: true,
    status: 'success',
    reference: cleanRef,
    amount: result.amountNGN ?? Number(tx.amount) / 100,
    newBalance: wallet.balance,
    alreadyProcessed: result.outcome === 'already_settled',
  }
}

// ─────────────────────────────────────────────
// Transfers
// ─────────────────────────────────────────────

/** Find a user by username (Send flow). Null when nobody has it. */
export async function lookupUser(profile: User, username: string): Promise<WalletResult<{ user: PublicUserCard | null }>> {
  const clean = String(username ?? '').toLowerCase().trim().replace(/^@/, '')
  if (!clean) return fail('Enter a username.')
  if (!(await rateLimit(`lookup:${profile.id}`, 30, 60))) return rateLimited()

  const { data } = await createServiceClient().from('users').select(USER_CARD_COLUMNS).eq('username', clean).maybeSingle()
  return { ok: true, user: data ? toCard(data as UserCardRow) : null }
}

/**
 * Send money to another user by username. PIN-checked (locks for 15 min after
 * 5 wrong tries); the debit, credit and both ledger rows happen in one
 * database transaction (web_wallet_transfer).
 */
export async function sendFunds(
  profile: User,
  recipientUsername: string,
  amountNGN: number,
  pin: string
): Promise<WalletResult<{ reference: string; newBalance: number }>> {
  if (!isAmount(amountNGN) || amountNGN < MIN_TRANSFER) return fail(`Minimum transfer amount is ₦${MIN_TRANSFER}`)
  if (!(await rateLimit(`send:${profile.id}`, 10, 600))) return rateLimited()

  const pinResult = await checkWalletPin(profile.id, String(pin ?? ''))
  if (!pinResult.ok) return pinFail(pinResult.error)

  const db = createServiceClient()
  const { data: recipient } = await db
    .from('users')
    .select('id')
    .eq('username', String(recipientUsername ?? '').toLowerCase().trim().replace(/^@/, ''))
    .maybeSingle()

  if (!recipient) return fail('Recipient not found. Check the username and try again.', 404)
  if (recipient.id === profile.id) return fail('You cannot send funds to yourself.')

  const reference = `TRF-${crypto.randomUUID()}`
  const { data: newBalance, error } = await db.rpc('web_wallet_transfer', {
    p_sender: profile.id,
    p_recipient: recipient.id,
    p_amount: amountNGN,
    p_ref: reference,
  })

  if (error) {
    if (error.message?.includes('Insufficient')) return fail('Insufficient balance.')
    console.error('sendFunds error:', error)
    return fail('Transfer failed. Please try again.', 503)
  }

  return { ok: true, reference, newBalance: Number(newBalance) }
}

// ─────────────────────────────────────────────
// Withdrawals
// ─────────────────────────────────────────────

export type WithdrawalInput = { amount: number; accountNumber: string; pin: string } & (
  | { bankName: string; accountName: string; bankCode?: undefined }
  /** Mobile: the server resolves the bank name and account holder from the code. */
  | { bankCode: string; bankName?: undefined; accountName?: undefined }
)

/**
 * Request a bank withdrawal: verify the PIN, then hold (debit) the amount and
 * record a pending withdrawal atomically. Payouts are made manually.
 */
export async function requestWithdrawal(
  profile: User,
  input: WithdrawalInput
): Promise<WalletResult<{ status: 'pending'; reference: string; accountName: string }>> {
  const amount = input.amount
  if (!isAmount(amount) || amount < MIN_WITHDRAWAL) return fail(`Minimum withdrawal amount is ₦${MIN_WITHDRAWAL}`)
  if (!(await rateLimit(`withdraw:${profile.id}`, 5, 3600))) return rateLimited()

  const pinResult = await checkWalletPin(profile.id, String(input.pin ?? ''))
  if (!pinResult.ok) return pinFail(pinResult.error)

  const accountNumber = String(input.accountNumber ?? '').trim()
  let bankName = input.bankName?.trim() ?? ''
  let accountName = input.accountName?.trim() ?? ''
  const bankCode = input.bankCode?.trim()

  if (bankCode !== undefined) {
    const name = await bankNameForCode(bankCode)
    if (!name) return fail('Please select a valid bank')
    const resolved = await resolveNuban(accountNumber, bankCode)
    if (!resolved.success || !resolved.accountName) {
      return fail(resolved.error || 'Could not verify this account.', resolved.unavailable ? 503 : 400)
    }
    bankName = name
    accountName = resolved.accountName
  }

  if (!/^\d{10}$/.test(accountNumber) || !bankName || !accountName) {
    return fail('Enter a valid bank, 10-digit account number and account name.')
  }

  const reference = `WTH-${crypto.randomUUID()}`
  const db = createServiceClient()
  const { error } = await db.rpc('web_wallet_debit', {
    p_user_id: profile.id,
    p_amount: amount,
    p_type: 'withdrawal',
    p_ref: reference,
    p_status: 'pending',
    p_bank_name: bankName,
    p_account_number: accountNumber,
    p_account_name: accountName,
  })

  if (error) {
    if (error.message?.includes('Insufficient')) return fail('Insufficient balance.')
    console.error('requestWithdrawal error:', error)
    return fail('Withdrawal request failed. Please try again.', 503)
  }

  // Bank code helps whoever pays it out; the hold above is already final.
  if (bankCode) {
    await db.from('transactions').update({ bank_code: bankCode }).eq('ref', reference).eq('type', 'withdrawal')
  }

  return { ok: true, status: 'pending', reference, accountName }
}

// ─────────────────────────────────────────────
// Banks
// ─────────────────────────────────────────────

/** Paystack's Nigerian bank list, popular banks first (cached 24h). */
export async function listBanks(): Promise<Bank[]> {
  return listNigerianBanks()
}

/** Resolve a NUBAN to the account holder's name (rate limited per user). */
export async function resolveBankAccount(
  profile: User,
  bankCode: string,
  accountNumber: string
): Promise<WalletResult<{ accountName: string; accountNumber: string; bankCode: string }>> {
  if (!(await rateLimit(`bank-resolve:${profile.id}`, 30, 600))) return rateLimited()
  const r = await resolveNuban(String(accountNumber ?? ''), String(bankCode ?? ''))
  if (!r.success || !r.accountName) return fail(r.error || 'Could not resolve account details.', r.unavailable ? 503 : 400)
  return { ok: true, accountName: r.accountName, accountNumber: r.accountNumber ?? '', bankCode: r.bankCode ?? '' }
}

// ─────────────────────────────────────────────
// PIN
// ─────────────────────────────────────────────

export async function getPinStatus(profile: User): Promise<{ hasPin: boolean }> {
  return { hasPin: await hasWalletPin(profile.id) }
}

/** Set or change the wallet PIN (4–6 digits). Changing needs the current PIN. */
export async function setPin(profile: User, pin: string, currentPin?: string): Promise<WalletResult> {
  if (!(await rateLimit(`pin-set:${profile.id}`, 5, 900))) return rateLimited()
  const result = await setWalletPin(profile.id, String(pin ?? ''), currentPin || undefined)
  if (!result.ok) return pinFail(result.error)
  return { ok: true }
}
