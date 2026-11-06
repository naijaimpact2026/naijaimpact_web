'use client'

import { useEffect, useRef, KeyboardEvent, ClipboardEvent } from 'react'

// Six single-digit boxes with auto-advance, backspace/arrow navigation and
// paste-to-fill. Shared by email verification and password reset.
export default function OtpInput({
    value,
    onChange,
    disabled,
    autoFocus = true,
}: {
    value: string[]
    onChange: (v: string[]) => void
    disabled?: boolean
    autoFocus?: boolean
})
{
    const refs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() =>
    {
        if (autoFocus) refs.current[0]?.focus()
    }, [autoFocus])

    const update = (idx: number, char: string) =>
    {
        const next = [...value]
        next[idx] = char.slice(-1)
        onChange(next)
        if (char && idx < 5) refs.current[idx + 1]?.focus()
    }

    const onKey = (idx: number, e: KeyboardEvent<HTMLInputElement>) =>
    {
        if (e.key === 'Backspace' && !value[idx] && idx > 0) refs.current[idx - 1]?.focus()
        if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus()
        if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus()
    }

    const onPaste = (e: ClipboardEvent<HTMLInputElement>) =>
    {
        e.preventDefault()
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (!text) return
        const next = Array(6).fill('')
        text.split('').forEach((c, i) => { next[i] = c })
        onChange(next)
        refs.current[Math.min(text.length, 5)]?.focus()
    }

    return (
        <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    disabled={disabled}
                    value={value[i] ?? ''}
                    onChange={(e) => update(i, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => onKey(i, e)}
                    onPaste={onPaste}
                    className="h-14 w-full rounded-lg border border-slate-300 bg-white text-center font-display text-2xl font-semibold text-ink outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:opacity-50"
                    aria-label={`Digit ${i + 1}`}
                />
            ))}
        </div>
    )
}
