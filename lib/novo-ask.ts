/** Opens the Novo companion and asks it a question (handled in components/app/mascot). */
export function askNovo(message: string)
{
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('novo:ask', { detail: { message } }))
}
