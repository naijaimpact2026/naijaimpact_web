import { addToast } from './toast-store'
import { triggerHaptic } from '@/lib/haptics'

function show(type: 'success' | 'error' | 'warning' | 'info', message: string): string
{
    triggerHaptic(type)
    return addToast(type, message)
}

export const toast = {
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message),
    warning: (message: string) => show('warning', message),
    info: (message: string) => show('info', message),
}
