import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@/lib/types'
import SettingsTabs from './_components/SettingsTabs'

export const metadata = { title: 'Settings — Hubnovo' }

export default async function SettingsPage()
{
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single()

    if (!profile) redirect('/auth/login')

    return (
        <div className="container-gutter max-w-2xl mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage your profile, security, privacy, and notifications
                </p>
            </div>
            <SettingsTabs user={profile as User} />
        </div>
    )
}
