'use client'

import Link from 'next/link'
import { ArrowLeft, Hourglass } from 'lucide-react'

export default function CreateFundingPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-slate-950">
            <div className="flex min-h-screen items-center justify-center px-6">
                <div className="w-full max-w-lg text-center">

                    <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                        <Hourglass
                            className="h-14 w-14 text-emerald-600 dark:text-emerald-400"
                            strokeWidth={1.5}
                        />
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Funding is Coming Soon
                    </h1>

                    <p className="mx-auto mt-5 max-w-md text-base leading-7 text-gray-500 dark:text-gray-400">
                        We&apos;re preparing something impactful.
                        Soon, you&apos;ll be able to start campaigns
                        and fund great ideas and projects on HubNovo.
                    </p>

                    <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 dark:bg-slate-800 dark:text-gray-300">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                        Coming Soon
                    </div>

                    <Link
                        href="/app/funding"
                        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Funding
                    </Link>

                </div>
            </div>
        </main>
    )
}
