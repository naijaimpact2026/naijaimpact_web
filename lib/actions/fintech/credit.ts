'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Wallet, LoanProduct, LoanApplication, Loan, LoanRepayment } from '@/lib/types'

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Resolve the platform users.id from the auth session. */
async function resolveProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Unauthenticated')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (profileError || !profile) throw new Error('User profile not found')

  return { authUser: user, profile }
}

/** Get or create the wallet row for a given users.id. */
async function getOrCreateWallet(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Wallet> {
  const { data: wallet } = await supabase
    .from('wallet')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (wallet) return wallet as Wallet

  const { data: created, error } = await supabase
    .from('wallet')
    .insert({ user_id: userId, balance: 0 })
    .select('*')
    .single()

  if (error || !created) throw new Error('Failed to create wallet')
  return created as Wallet
}

// ─── fetchCreditDashboard ────────────────────────────────────────────────────

export interface CreditDashboardData {
  loanProducts: LoanProduct[]
  loanApplications: LoanApplication[]
  loans: Loan[]
  repayments: LoanRepayment[]
  pendingApplicationsCount: number
  activeLoansCount: number
  totalOutstandingBalance: number
  nextRepaymentDate: string | null
}

export async function fetchCreditDashboard(): Promise<CreditDashboardData> {
  const supabase = await createClient()
  const { profile } = await resolveProfile(supabase)

  const [
    { data: loanProducts },
    { data: loanApplications },
    { data: loans },
    { data: repayments },
  ] = await Promise.all([
    supabase
      .from('fintech_credit_loan_products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true }),

    supabase
      .from('fintech_credit_loan_applications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('fintech_credit_loans')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('fintech_credit_repayments')
      .select('*')
      .in(
        'loan_id',
        // placeholder — we'll replace with actual loan IDs below if we have them
        ['00000000-0000-0000-0000-000000000000']
      )
      .order('due_date', { ascending: true }),
  ])

  const typedLoans = (loans ?? []) as Loan[]
  const loanIds = typedLoans.map((l) => l.id)

  // Fetch repayments properly after we have loan IDs
  let typedRepayments: LoanRepayment[] = []
  if (loanIds.length > 0) {
    const { data: reps } = await supabase
      .from('fintech_credit_repayments')
      .select('*')
      .in('loan_id', loanIds)
      .order('due_date', { ascending: true })
    typedRepayments = (reps ?? []) as LoanRepayment[]
  }

  const typedApplications = (loanApplications ?? []) as LoanApplication[]

  const pendingApplicationsCount = typedApplications.filter((a) => a.status === 'pending').length
  const activeLoansCount = typedLoans.filter((l) => l.status === 'active').length

  const outstandingRepayments = typedRepayments.filter(
    (r) => r.status === 'pending' || r.status === 'overdue'
  )
  const totalOutstandingBalance = outstandingRepayments.reduce((sum, r) => sum + r.amount + r.late_fee, 0)

  const pendingRepayments = typedRepayments
    .filter((r) => r.status === 'pending' || r.status === 'overdue')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  const nextRepaymentDate = pendingRepayments.length > 0 ? pendingRepayments[0].due_date : null

  return {
    loanProducts: (loanProducts ?? []) as LoanProduct[],
    loanApplications: typedApplications,
    loans: typedLoans,
    repayments: typedRepayments,
    pendingApplicationsCount,
    activeLoansCount,
    totalOutstandingBalance,
    nextRepaymentDate,
  }
}

// ─── applyForLoan ────────────────────────────────────────────────────────────

export interface ApplyForLoanInput {
  product_id: string
  amount: number
  tenure_months: number
}

export async function applyForLoan(
  data: ApplyForLoanInput
): Promise<ActionResult<{ applicationId: string }>> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    if (!data.product_id) {
      return { success: false, error: 'Loan product is required.' }
    }
    if (!data.amount || data.amount <= 0) {
      return { success: false, error: 'Loan amount must be greater than 0.' }
    }
    if (!data.tenure_months || data.tenure_months <= 0) {
      return { success: false, error: 'Tenure is required.' }
    }

    // Verify the loan product exists and is active
    const { data: product, error: productError } = await supabase
      .from('fintech_credit_loan_products')
      .select('*')
      .eq('id', data.product_id)
      .eq('active', true)
      .maybeSingle()

    if (productError || !product) {
      return { success: false, error: 'Loan product not found or unavailable.' }
    }

    const loanProduct = product as LoanProduct

    // Validate amount range
    if (data.amount < loanProduct.min_amount) {
      return {
        success: false,
        error: `Minimum loan amount for this product is ₦${loanProduct.min_amount.toLocaleString()}.`,
      }
    }
    if (data.amount > loanProduct.max_amount) {
      return {
        success: false,
        error: `Maximum loan amount for this product is ₦${loanProduct.max_amount.toLocaleString()}.`,
      }
    }

    // Validate tenure is in product's tenure_options
    if (!loanProduct.tenure_options.includes(data.tenure_months)) {
      return {
        success: false,
        error: `Invalid tenure. Allowed options: ${loanProduct.tenure_options.join(', ')} months.`,
      }
    }

    // Insert application row
    const { data: application, error: insertError } = await supabase
      .from('fintech_credit_loan_applications')
      .insert({
        user_id: profile.id,
        product_id: data.product_id,
        amount: data.amount,
        tenure_months: data.tenure_months,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError || !application) {
      console.error('[applyForLoan] insert error:', insertError)
      return { success: false, error: 'Failed to submit application. Please try again.' }
    }

    revalidatePath('/app/fintech/credit')
    return { success: true, data: { applicationId: application.id } }
  } catch (err) {
    console.error('[applyForLoan] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── makeRepayment ───────────────────────────────────────────────────────────

export async function makeRepayment(
  repaymentId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { profile } = await resolveProfile(supabase)

    // Fetch the repayment record
    const { data: repayment, error: repError } = await supabase
      .from('fintech_credit_repayments')
      .select('*')
      .eq('id', repaymentId)
      .maybeSingle()

    if (repError || !repayment) {
      return { success: false, error: 'Repayment record not found.' }
    }

    const rep = repayment as LoanRepayment

    if (rep.status === 'paid') {
      return { success: false, error: 'This installment has already been paid.' }
    }

    // Verify the loan belongs to the current user
    const { data: loan, error: loanError } = await supabase
      .from('fintech_credit_loans')
      .select('*')
      .eq('id', rep.loan_id)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (loanError || !loan) {
      return { success: false, error: 'Loan not found or access denied.' }
    }

    const totalDue = rep.amount + rep.late_fee

    // Check wallet balance
    const wallet = await getOrCreateWallet(supabase, profile.id)
    if (wallet.balance < totalDue) {
      return { success: false, error: 'Insufficient wallet balance.' }
    }

    // Debit wallet
    const { error: debitError } = await supabase
      .from('wallet')
      .update({
        balance: wallet.balance - totalDue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    if (debitError) {
      console.error('[makeRepayment] debit error:', debitError)
      return { success: false, error: 'Payment failed. Please try again.' }
    }

    // Update repayment record to paid
    const { error: repUpdateError } = await supabase
      .from('fintech_credit_repayments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', repaymentId)

    if (repUpdateError) {
      console.error('[makeRepayment] repayment update error:', repUpdateError)
      // Rollback wallet
      await supabase
        .from('wallet')
        .update({ balance: wallet.balance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)
      return { success: false, error: 'Failed to record payment. Please try again.' }
    }

    // Insert transaction record
    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'loan_repayment',
      amount: totalDue,
      status: 'success',
      reference_id: rep.loan_id,
      description: `Loan repayment — installment ${rep.installment}`,
    })

    // Check if all repayments for this loan are now paid
    const { data: remainingRepayments } = await supabase
      .from('fintech_credit_repayments')
      .select('id, status')
      .eq('loan_id', rep.loan_id)
      .neq('status', 'paid')

    const allPaid = !remainingRepayments || remainingRepayments.length === 0

    if (allPaid) {
      await supabase
        .from('fintech_credit_loans')
        .update({ status: 'completed' })
        .eq('id', rep.loan_id)
    }

    revalidatePath('/app/fintech/credit')
    return { success: true }
  } catch (err) {
    console.error('[makeRepayment] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
