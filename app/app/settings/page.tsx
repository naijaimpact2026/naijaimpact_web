import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import SettingsTabs from './_components/SettingsTabs'
import { hasWalletPin } from '@/lib/wallet-pin'

export const metadata = { title: 'Settings — HubNovo' }

export default async function SettingsPage()
{
    const { authUser, profile } = await getCurrentUser()

    if (!authUser) redirect('/auth/login')
    if (!profile) redirect('/auth/login')

    const hasPin = await hasWalletPin(profile.id)

    return (
        <div className="container-gutter max-w-2xl mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage your profile, security, privacy, and notifications
                </p>
            </div>
            <SettingsTabs user={profile} hasPin={hasPin} />
        </div>
    )
}
