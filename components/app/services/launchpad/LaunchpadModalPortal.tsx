'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface LaunchpadModalPortalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    className?: string
}

/**
 * Portals modal dialogs directly to document.body.
 * This completely isolates them from any parent CSS transforms, filters,
 * or layout wrappers (such as AppShell animation containers), guaranteeing
 * that `fixed inset-0` spans the actual browser viewport and centers
 * the modal directly in front of the user without needing to scroll.
 */
export default function LaunchpadModalPortal({
    isOpen,
    onClose,
    children,
    className = '',
}: LaunchpadModalPortalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        if (!isOpen) return

        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.body.style.overflow = originalOverflow
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onClose])

    if (!isOpen || !mounted || typeof document === 'undefined') return null

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto ${className}`}
            onClick={(e) => {
                // Close when clicking directly on the backdrop (not inside modal content)
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
        >
            {children}
        </div>,
        document.body
    )
}
