export interface PaystackConfig {
  key: string
  email: string
  amount: number
  currency?: string
  ref: string
  metadata?: Record<string, unknown>
  onSuccess?: (transaction: { reference: string }) => void
  callback?: (response: { reference: string }) => void
  onClose?: () => void
}

declare global {
  interface Window {
    PaystackPop?: {
      setup(config: PaystackConfig): { openIframe(): void }
    }
  }
}
