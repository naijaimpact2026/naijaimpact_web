'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Upload, User, Eye, EyeOff, AlertTriangle, Trash2, Sun, Moon, Monitor } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import
{
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

import
{
    updateProfile,
    setPin,
    updatePrivacy,
    updateNotifications,
    deleteAccount,
} from '@/lib/actions/profile'
import type { User as AppUser } from '@/lib/types'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
    display_name: z
        .string()
        .min(1, 'Display name is required')
        .max(50, 'Display name must be 50 characters or fewer'),
    bio: z.string().max(160, 'Bio must be 160 characters or fewer').optional(),
    profession: z.string().max(100).optional(),
    avatar_url: z.string().optional(),
})

const pinSchema = z
    .object({
        current_pin: z.string().optional(),
        new_pin: z
            .string()
            .length(6, 'PIN must be exactly 6 digits')
            .regex(/^\d{6}$/, 'PIN must contain only digits'),
        confirm_pin: z
            .string()
            .length(6, 'PIN must be exactly 6 digits')
            .regex(/^\d{6}$/, 'PIN must contain only digits'),
    })
    .refine((d) => d.new_pin === d.confirm_pin, {
        path: ['confirm_pin'],
        message: 'PINs do not match',
    })

type ProfileValues = z.infer<typeof profileSchema>
type PinValues = z.infer<typeof pinSchema>

// ─── Avatar upload helper ─────────────────────────────────────────────────────

function useAvatarUpload(currentUrl: string | null)
{
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(currentUrl)

    const upload = useCallback(async (file: File): Promise<string | null> =>
    {
        setUploading(true)
        try
        {
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch('/api/upload', { method: 'POST', body: fd })
            if (!res.ok) throw new Error('Upload failed')
            const json = await res.json()
            const url: string = json.url ?? null
            setPreview(url)
            return url
        } catch (err)
        {
            console.warn('Avatar upload skipped:', err)
            setPreview(URL.createObjectURL(file))
            toast.warning('Avatar upload is not available yet. Changes to other fields were saved.')
            return null
        } finally
        {
            setUploading(false)
        }
    }, [])

    return { upload, uploading, preview, setPreview }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SettingsTabsProps
{
    user: AppUser
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ user }: { user: AppUser })
{
    const { upload, uploading, preview } = useAvatarUpload(user.avatar_url)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [saving, setSaving] = useState(false)

    const form = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            display_name: user.display_name,
            bio: user.bio ?? '',
            profession: user.profession ?? '',
            avatar_url: user.avatar_url ?? '',
        },
    })

    const bioValue = form.watch('bio') ?? ''

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>)
    {
        const file = e.target.files?.[0]
        if (!file) return
        const url = await upload(file)
        if (url) form.setValue('avatar_url', url)
    }

    async function onSubmit(values: ProfileValues)
    {
        setSaving(true)
        try
        {
            const result = await updateProfile({
                display_name: values.display_name,
                bio: values.bio || undefined,
                profession: values.profession || undefined,
                avatar_url: values.avatar_url || undefined,
            })
            if (result.success)
            {
                toast.success('Profile updated successfully.')
            } else
            {
                toast.error(result.error)
            }
        } finally
        {
            setSaving(false)
        }
    }

    return (
        <div className="bento-card noise-bg p-6 space-y-6">
            <h2 className="font-semibold text-lg">Profile</h2>

            {/* Avatar */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full border-2 border-dashed border-primary/50 hover:border-primary transition-colors overflow-hidden bg-muted flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Change avatar"
                >
                    {preview ? (
                        <Image src={preview} alt="Avatar" fill className="object-cover" />
                    ) : (
                        <User className="w-7 h-7 text-muted-foreground" />
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                    )}
                </button>
                <div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        {preview ? 'Change photo' : 'Upload photo'}
                    </button>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        JPG, PNG or GIF · max 5 MB
                    </p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    aria-label="Avatar file input"
                />
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <FormField
                        control={form.control}
                        name="display_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Name <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                    <Textarea
                                        className="resize-none"
                                        rows={3}
                                        maxLength={160}
                                        {...field}
                                    />
                                </FormControl>
                                <div className="flex justify-end">
                                    <span
                                        className={`text-xs ${bioValue.length > 150 ? 'text-destructive' : 'text-muted-foreground'
                                            }`}
                                    >
                                        {bioValue.length}/160
                                    </span>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="profession"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Profession</FormLabel>
                                <FormControl>
                                    <Input placeholder="Software Engineer, Nurse…" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" disabled={saving || uploading}>
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving…
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    )
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab({ user }: { user: AppUser })
{
    const hasPin = Boolean(user.wallet_pin)
    const [saving, setSaving] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showCurrent, setShowCurrent] = useState(false)

    const form = useForm<PinValues>({
        resolver: zodResolver(pinSchema),
        defaultValues: { current_pin: '', new_pin: '', confirm_pin: '' },
    })

    async function onSubmit(values: PinValues)
    {
        setSaving(true)
        try
        {
            const result = await setPin({
                pin: values.new_pin,
                current_pin: values.current_pin || undefined,
            })
            if (result.success)
            {
                toast.success(hasPin ? 'PIN changed successfully.' : 'PIN set successfully.')
                form.reset()
            } else
            {
                toast.error(result.error)
                if (result.error.toLowerCase().includes('current'))
                {
                    form.setError('current_pin', { message: result.error })
                }
            }
        } finally
        {
            setSaving(false)
        }
    }

    return (
        <div className="bento-card noise-bg p-6 space-y-6">
            <div>
                <h2 className="font-semibold text-lg">Security</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    {hasPin
                        ? 'Change your 6-digit wallet PIN'
                        : 'Set a 6-digit PIN to secure wallet transactions'}
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    {hasPin && (
                        <FormField
                            control={form.control}
                            name="current_pin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current PIN</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showCurrent ? 'text' : 'password'}
                                                inputMode="numeric"
                                                maxLength={6}
                                                placeholder="······"
                                                className="pr-10 tracking-[0.4em]"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrent((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                aria-label={showCurrent ? 'Hide PIN' : 'Show PIN'}
                                            >
                                                {showCurrent ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="new_pin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{hasPin ? 'New PIN' : 'PIN'}</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showNew ? 'text' : 'password'}
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="······"
                                            className="pr-10 tracking-[0.4em]"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            aria-label={showNew ? 'Hide PIN' : 'Show PIN'}
                                        >
                                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormDescription className="text-xs">Must be exactly 6 digits</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirm_pin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm {hasPin ? 'New ' : ''}PIN</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showConfirm ? 'text' : 'password'}
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="······"
                                            className="pr-10 tracking-[0.4em]"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            aria-label={showConfirm ? 'Hide PIN' : 'Show PIN'}
                                        >
                                            {showConfirm ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving…
                            </>
                        ) : hasPin ? (
                            'Change PIN'
                        ) : (
                            'Set PIN'
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    )
}

// ─── Privacy Tab ──────────────────────────────────────────────────────────────

function PrivacyTab({ user }: { user: AppUser })
{
    const [isPrivate, setIsPrivate] = useState(user.is_private)
    const [saving, setSaving] = useState(false)

    async function handleToggle(checked: boolean)
    {
        setIsPrivate(checked)
        setSaving(true)
        try
        {
            const result = await updatePrivacy({ is_private: checked })
            if (result.success)
            {
                toast.success(checked ? 'Account set to private.' : 'Account set to public.')
            } else
            {
                toast.error(result.error)
                setIsPrivate(!checked) // revert
            }
        } finally
        {
            setSaving(false)
        }
    }

    return (
        <div className="bento-card noise-bg p-6 space-y-6">
            <h2 className="font-semibold text-lg">Privacy</h2>

            <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">Private Account</p>
                    <p className="text-xs text-muted-foreground">
                        When your account is private, only approved followers can see your posts and activity.
                    </p>
                </div>
                <Switch
                    checked={isPrivate}
                    onCheckedChange={handleToggle}
                    disabled={saving}
                    aria-label="Toggle private account"
                />
            </div>
        </div>
    )
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

interface NotifToggle
{
    key: keyof Pick<
        AppUser,
        | 'notifications_follows'
        | 'notifications_reactions'
        | 'notifications_comments'
        | 'notifications_mentions'
    >
    label: string
    description: string
}

const NOTIF_TOGGLES: NotifToggle[] = [
    {
        key: 'notifications_follows',
        label: 'Follows',
        description: 'Get notified when someone follows you',
    },
    {
        key: 'notifications_reactions',
        label: 'Reactions',
        description: 'Get notified when someone reacts to your posts',
    },
    {
        key: 'notifications_comments',
        label: 'Comments',
        description: 'Get notified when someone comments on your posts',
    },
    {
        key: 'notifications_mentions',
        label: 'Mentions',
        description: 'Get notified when someone mentions you in a post',
    },
]

function NotificationsTab({ user }: { user: AppUser })
{
    const [prefs, setPrefs] = useState({
        notifications_follows: user.notifications_follows,
        notifications_reactions: user.notifications_reactions,
        notifications_comments: user.notifications_comments,
        notifications_mentions: user.notifications_mentions,
    })
    const [savingKey, setSavingKey] = useState<string | null>(null)

    async function handleToggle(
        key: keyof typeof prefs,
        checked: boolean,
    )
    {
        const prev = prefs[key]
        setPrefs((p) => ({ ...p, [key]: checked }))
        setSavingKey(key)

        try
        {
            const next = { ...prefs, [key]: checked }
            const result = await updateNotifications(next)
            if (result.success)
            {
                toast.success('Notification preferences updated.')
            } else
            {
                toast.error(result.error)
                setPrefs((p) => ({ ...p, [key]: prev })) // revert
            }
        } finally
        {
            setSavingKey(null)
        }
    }

    return (
        <div className="bento-card noise-bg p-6 space-y-6">
            <h2 className="font-semibold text-lg">Notifications</h2>
            <div className="space-y-4">
                {NOTIF_TOGGLES.map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                        <Switch
                            checked={prefs[key]}
                            onCheckedChange={(checked) => handleToggle(key, checked)}
                            disabled={savingKey === key}
                            aria-label={`Toggle ${label.toLowerCase()} notifications`}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────

const THEME_OPTIONS = [
    {
        value: 'light',
        icon: Sun,
        label: 'Light',
        desc: 'Clean white background',
        preview: 'bg-white border-gray-200',
        previewDot: 'bg-gray-800',
    },
    {
        value: 'dark',
        icon: Moon,
        label: 'Dark',
        desc: 'Easy on the eyes at night',
        preview: 'bg-gray-900 border-gray-700',
        previewDot: 'bg-white',
    },
    {
        value: 'system',
        icon: Monitor,
        label: 'System',
        desc: 'Follows your device setting',
        preview: 'bg-gradient-to-br from-white to-gray-900 border-gray-400',
        previewDot: 'bg-gray-500',
    },
] as const

function AppearanceTab()
{
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch — only read theme state after client mount
    useEffect(() => { setMounted(true) }, [])

    return (
        <div className="space-y-4">
            <div className="bento-card noise-bg p-6 space-y-5">
                <div>
                    <h2 className="font-semibold text-lg">Appearance</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Choose how Hubnovo looks to you
                    </p>
                </div>

                {/* Theme picker cards */}
                <div className="grid grid-cols-3 gap-3">
                    {THEME_OPTIONS.map(opt =>
                    {
                        const isActive = mounted && theme === opt.value
                        const Icon = opt.icon
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setTheme(opt.value)}
                                className={`relative flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all text-center ${isActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/40 bg-background'
                                    }`}
                            >
                                {isActive && (
                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                        <span className="w-2 h-2 rounded-full bg-white" />
                                    </span>
                                )}
                                {/* Mini preview */}
                                <div className={`w-full h-10 rounded-xl border-2 ${opt.preview} flex items-center justify-center`}>
                                    <div className={`w-3 h-3 rounded-full ${opt.previewDot}`} />
                                </div>
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div>
                                    <p className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                        {opt.label}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{opt.desc}</p>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Active theme badge */}
                {mounted && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
                        {resolvedTheme === 'dark'
                            ? <Moon className="w-3.5 h-3.5 text-primary" />
                            : <Sun className="w-3.5 h-3.5 text-amber-500" />
                        }
                        <span>
                            Currently using <strong className="text-foreground">
                                {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
                            </strong> mode
                            {theme === 'system' && ' (system default)'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Danger Zone Tab ──────────────────────────────────────────────────────────

const DELETE_STEPS = [
    { step: '01', icon: '📱', title: 'Open the Hubnovo App', description: 'Launch the Hubnovo mobile application or visit the website on your device. Ensure you are logged into the account you wish to delete.' },
    { step: '02', icon: '👤', title: 'Go to Your Profile', description: 'Tap your profile icon or avatar at the top of the screen. Select "My Profile" or "Account Settings" from the menu.' },
    { step: '03', icon: '⚙️', title: 'Open Account Settings', description: 'Scroll down within your profile or settings page to find the "Account" section. Look for "Privacy & Security" or "Account Management".' },
    { step: '04', icon: '🗑️', title: 'Select "Delete Account"', description: 'Tap on "Delete Account" or "Close Account". Read the information provided about what will happen to your data and memberships.' },
    { step: '05', icon: '✅', title: 'Verify Your Identity', description: 'For your security, you may be asked to confirm your password, enter a verification code sent to your phone or email, or answer security questions.' },
    { step: '06', icon: '📋', title: 'Confirm Deletion', description: 'Review the final confirmation screen. This is irreversible — once confirmed, your account and associated data will be scheduled for deletion.' },
]

const DELETE_WARNINGS = [
    { icon: '💰', title: 'Cooperative Savings', desc: 'Outstanding cooperative savings or loans may need to be settled before account deletion is processed.' },
    { icon: '🎓', title: 'Scholarships & Grants', desc: 'Active scholarship or grant enrollments may be cancelled. Contact support to discuss alternatives.' },
    { icon: '📊', title: 'Transaction Records', desc: 'Financial records required for legal compliance may be retained even after account deletion.' },
    { icon: '⏳', title: 'Processing Time', desc: 'Account deletion may take up to 30 days to fully process across all systems.' },
]

const RETENTION_ITEMS = [
    'Transaction and payment records — retained for up to 7 years',
    'Cooperative and loan records — retained as required by financial regulators',
    'Identity verification data — retained for anti-money laundering compliance',
    'Audit logs — retained for security and legal purposes',
]

// Three-stage flow: idle → confirming (show typed-confirm) → deleting
type DeleteStage = 'idle' | 'confirming' | 'deleting'

function DangerZoneTab({ user }: { user: AppUser })
{
    const [stage, setStage] = useState<DeleteStage>('idle')
    const [confirmText, setConfirmText] = useState('')
    const [error, setError] = useState<string | null>(null)
    const confirmed = confirmText === 'DELETE'

    async function handleDelete()
    {
        if (!confirmed) return
        setError(null)
        setStage('deleting')
        try
        {
            const result = await deleteAccount()
            // deleteAccount redirects on success; if we get here it failed
            if (result && !result.success)
            {
                setError(result.error)
                setStage('confirming')
            }
        } catch
        {
            // redirect() throws — that's expected on success
        }
    }

    function handleCancel()
    {
        setStage('idle')
        setConfirmText('')
        setError(null)
    }

    return (
        <div className="space-y-4">

            {/* ── Warning banner ── */}
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-amber-100"
                    style={{ background: 'linear-gradient(135deg,#fffbeb,#ffffff)' }}>
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="text-sm font-black text-amber-800">Important Warning</span>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm text-amber-700 leading-relaxed">
                        Deleting your account will permanently remove your profile, membership data, activity history, and any associated benefits.{' '}
                        <strong>This action is permanent and cannot be undone.</strong>{' '}
                        Please read all information carefully before proceeding.
                    </p>
                </div>
            </div>

            {/* ── Steps ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                    style={{ background: 'linear-gradient(135deg,#fff1f2,#ffffff)' }}>
                    <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-base shrink-0">🗑️</div>
                    <h3 className="text-sm font-black text-gray-900">How to Delete Your Account</h3>
                </div>
                <div className="px-5 py-5 space-y-1">
                    {DELETE_STEPS.map((s, i) => (
                        <div key={s.step} className="flex items-start gap-4">
                            <div className="flex flex-col items-center shrink-0">
                                <div className="w-9 h-9 rounded-xl bg-red-50 border-2 border-red-100 flex items-center justify-center text-base">
                                    {s.icon}
                                </div>
                                {i < DELETE_STEPS.length - 1 && (
                                    <div className="w-0.5 h-4 bg-gray-100 mt-1" />
                                )}
                            </div>
                            <div className="flex-1 pb-3">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                        Step {s.step}
                                    </span>
                                    <p className="text-sm font-bold text-gray-900">{s.title}</p>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── What happens ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                    style={{ background: 'linear-gradient(135deg,#fffbeb,#ffffff)' }}>
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-base shrink-0">⚠️</div>
                    <h3 className="text-sm font-black text-gray-900">What Happens When You Delete</h3>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                    {DELETE_WARNINGS.map((w, i) => (
                        <div key={i} className="rounded-xl p-4 border border-gray-100 bg-gray-50">
                            <div className="text-xl mb-1.5">{w.icon}</div>
                            <p className="text-xs font-bold text-gray-800 mb-1">{w.title}</p>
                            <p className="text-xs text-gray-500 leading-relaxed">{w.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Data retention ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                    style={{ background: 'linear-gradient(135deg,#eff6ff,#ffffff)' }}>
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-base shrink-0">🗂️</div>
                    <h3 className="text-sm font-black text-gray-900">Data Retained After Deletion</h3>
                </div>
                <div className="px-5 py-4">
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                        In accordance with Nigerian data protection laws (NDPA/NDPR) and financial regulations, certain data may be retained for legal, regulatory, or fraud prevention purposes:
                    </p>
                    <ul className="space-y-2">
                        {RETENTION_ITEMS.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* ── Email alternative ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50"
                    style={{ background: 'linear-gradient(135deg,#f0fdf4,#ffffff)' }}>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-base shrink-0">✉️</div>
                    <h3 className="text-sm font-black text-gray-900">Prefer to Request via Email?</h3>
                </div>
                <div className="px-5 py-4">
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                        If you cannot access your account settings, email our support team with: your full name, registered email, phone number, and membership ID.
                    </p>
                    <a href="mailto:support@Hubnovo.org?subject=Account%20Deletion%20Request"
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors">
                        ✉️ Send Deletion Request Email
                    </a>
                </div>
            </div>

            {/* ── Delete action panel ── */}
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-red-100"
                    style={{ background: 'linear-gradient(135deg,#fff1f2,#ffffff)' }}>
                    <Trash2 className="w-5 h-5 text-red-600 shrink-0" />
                    <h3 className="text-sm font-black text-red-800">Delete My Account</h3>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        Irreversible
                    </span>
                </div>
                <div className="px-5 py-5 space-y-4">
                    {stage === 'idle' && (
                        <>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Ready to permanently delete your account? This cannot be undone. Your data, posts, wallet history, and community membership will all be removed.
                            </p>
                            <button
                                onClick={() => setStage('confirming')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                I want to delete my account
                            </button>
                        </>
                    )}

                    {(stage === 'confirming' || stage === 'deleting') && (
                        <div className="space-y-4">
                            {/* Red alert box */}
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-red-800 mb-1">Final confirmation required</p>
                                    <p className="text-xs text-red-700 leading-relaxed">
                                        Type <strong className="font-black tracking-wide">DELETE</strong> in the box below to confirm. This action is permanent — your account, posts, wallet, and all associated data will be removed.
                                    </p>
                                </div>
                            </div>

                            {/* Typed confirmation input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Type DELETE to confirm
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    disabled={stage === 'deleting'}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold tracking-widest transition-colors outline-none
                                        ${confirmed
                                            ? 'border-red-400 bg-red-50 text-red-700 focus:border-red-500'
                                            : 'border-gray-200 bg-gray-50 text-gray-700 focus:border-gray-400'
                                        } disabled:opacity-60`}
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                    <p className="text-xs text-red-700 font-medium">{error}</p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={!confirmed || stage === 'deleting'}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    {stage === 'deleting' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting…
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Permanently Delete Account
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={stage === 'deleting'}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Privacy policy link ── */}
            <div className="text-center pb-2">
                <Link href="/privacy-policy"
                    className="text-xs text-gray-400 hover:text-emerald-700 transition-colors font-medium">
                    📄 Read our Privacy Policy
                </Link>
            </div>
        </div>
    )
}

// ─── Main Tabs component ──────────────────────────────────────────────────────

export default function SettingsTabs({ user }: SettingsTabsProps)
{
    return (
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="w-full grid grid-cols-6 mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="notifications">Alerts</TabsTrigger>
                <TabsTrigger value="appearance">Theme</TabsTrigger>
                <TabsTrigger value="danger" className="text-red-600 data-[state=active]:text-red-700">
                    Danger
                </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
                <ProfileTab user={user} />
            </TabsContent>

            <TabsContent value="security">
                <SecurityTab user={user} />
            </TabsContent>

            <TabsContent value="privacy">
                <PrivacyTab user={user} />
            </TabsContent>

            <TabsContent value="notifications">
                <NotificationsTab user={user} />
            </TabsContent>

            <TabsContent value="appearance">
                <AppearanceTab />
            </TabsContent>

            <TabsContent value="danger">
                <DangerZoneTab user={user} />
            </TabsContent>
        </Tabs>
    )
}
