'use client'

import { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/components/toast'
import {
    Loader2,
    CheckCircle,
    XCircle,
    Upload,
    User,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Briefcase,
    MapPin,
    BadgeCheck,
    Camera,
    RefreshCw,
} from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import {
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
import { completeOnboarding } from '@/lib/actions/profile'
import { createClient } from '@/lib/supabase/client'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
    display_name: z
        .string()
        .min(1, 'Display name is required')
        .max(50, 'Display name must be 50 characters or fewer'),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be 30 characters or fewer')
        .regex(
            /^[a-zA-Z0-9_]+$/,
            'Username can only contain letters, numbers, and underscores',
        )
        .refine((v) => !v.toLowerCase().startsWith('user_'), {
            message: 'Username cannot start with "user_". Please choose a custom handle.',
        })
        .transform((v) => v.toLowerCase()),
    bio: z.string().max(160, 'Bio must be 160 characters or fewer').optional().or(z.literal('')),
    profession: z.string().max(100, 'Profession must be 100 characters or fewer').optional().or(z.literal('')),
    location: z.string().max(100, 'Location must be 100 characters or fewer').optional().or(z.literal('')),
    avatar_url: z.string().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

// ─── Username uniqueness check (debounced) ────────────────────────────────────

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid_prefix' | 'error'

function useUsernameCheck(username: string) {
    const [status, setStatus] = useState<UsernameStatus>('idle')
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        if (!username || username.length < 3) {
            setStatus('idle')
            return
        }

        const clean = username.trim().toLowerCase()
        if (clean.startsWith('user_')) {
            setStatus('invalid_prefix')
            return
        }

        if (timerRef.current) clearTimeout(timerRef.current)

        timerRef.current = setTimeout(async () => {
            setStatus('checking')

            try {
                const {
                    data: { user: authUser },
                } = await supabase.auth.getUser()

                const { data, error } = await supabase
                    .from('users')
                    .select('id, auth_id')
                    .ilike('username', clean)
                    .maybeSingle()

                if (error) {
                    console.error('Username check error:', error)
                    setStatus('error')
                } else {
                    // A row matching your OWN account isn't "taken"
                    const takenByOther =
                        !!data && data.auth_id !== authUser?.id && data.id !== authUser?.id
                    setStatus(takenByOther ? 'taken' : 'available')
                }
            } catch (error) {
                console.error('Username check error:', error)
                setStatus('error')
            }
        }, 300)

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [username, supabase])

    return status
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

function useAvatarUpload() {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)

    const upload = useCallback(async (file: File): Promise<string | null> => {
        setUploading(true)

        try {
            // Show selected image locally right away
            const localPreview = URL.createObjectURL(file)
            setPreview(localPreview)

            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const json = await res.json()

            if (!res.ok) {
                console.error('Avatar upload failed:', json)
                throw new Error(json.detail || json.error || 'Avatar upload failed')
            }

            const url = json.url || json.secure_url
            if (!url) {
                throw new Error('Upload succeeded but no image URL was returned.')
            }

            setPreview(url)
            return url
        } catch (err) {
            console.error('Avatar upload error:', err)
            toast.error(err instanceof Error ? err.message : 'Failed to upload photo.')
            return null
        } finally {
            setUploading(false)
        }
    }, [])

    return {
        upload,
        uploading,
        preview,
        setPreview,
    }
}

// ─── Popular Profession Suggestions ──────────────────────────────────────────

const SUGGESTED_ROLES = [
    'Software Developer',
    'Creative Designer',
    'Artisan / Trade',
    'Entrepreneur / Founder',
    'Marketer',
    'Student',
    'Content Creator',
    'Healthcare Specialist',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
    const [submitting, setSubmitting] = useState(false)
    const [suggesting, setSuggesting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            display_name: '',
            username: '',
            bio: '',
            profession: '',
            location: '',
            avatar_url: '',
        },
    })

    const usernameValue = form.watch('username')
    const displayNameValue = form.watch('display_name')
    const bioValue = form.watch('bio') ?? ''
    const professionValue = form.watch('profession') ?? ''
    const locationValue = form.watch('location') ?? ''
    const avatarUrlValue = form.watch('avatar_url') ?? ''

    const usernameStatus = useUsernameCheck(usernameValue)
    const { upload, uploading, preview, setPreview } = useAvatarUpload()

    // Pre-fill form from existing profile or auth metadata
    useEffect(() => {
        let mounted = true
        async function loadInitial() {
            try {
                const supabase = createClient()
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) return

                const { data: profile } = await supabase
                    .from('users')
                    .select('display_name, fullname, username, bio, profession, location, avatar_url')
                    .or(`auth_id.eq.${user.id},id.eq.${user.id}`)
                    .maybeSingle()

                if (!mounted) return

                const name =
                    profile?.display_name ||
                    profile?.fullname ||
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    ''
                let uname = profile?.username || user.user_metadata?.username || ''
                if (uname.startsWith('user_') && user.email) {
                    const candidate = user.email
                        .split('@')[0]
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, '')
                    if (candidate.length >= 3) {
                        uname = candidate
                    } else if (name && name !== 'Hubnovo Member') {
                        uname = name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 15)
                    }
                }
                const avatar =
                    profile?.avatar_url ||
                    user.user_metadata?.avatar_url ||
                    user.user_metadata?.picture ||
                    ''

                if (name && name !== 'Hubnovo Member' && !form.getValues('display_name')) {
                    form.setValue('display_name', name)
                }
                if (uname && !uname.startsWith('user_') && !form.getValues('username')) {
                    form.setValue('username', uname.toLowerCase())
                }
                if (profile?.bio && !form.getValues('bio')) form.setValue('bio', profile.bio)
                if (profile?.profession && !form.getValues('profession')) {
                    form.setValue('profession', profile.profession)
                }
                if (profile?.location && !form.getValues('location')) {
                    form.setValue('location', profile.location)
                }
                if (avatar && !form.getValues('avatar_url')) {
                    form.setValue('avatar_url', avatar)
                    setPreview(avatar)
                }
            } catch (err) {
                console.error('Error prefilling onboarding:', err)
            }
        }
        loadInitial()
        return () => {
            mounted = false
        }
    }, [form, setPreview])

    // Generate smart handle suggestion from display name or email
    const handleGenerateSuggestion = async () => {
        setSuggesting(true)
        try {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()
            const base = (
                displayNameValue ||
                user?.email?.split('@')[0] ||
                'member'
            )
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '')
                .slice(0, 15)

            const randomSuffix = Math.floor(100 + Math.random() * 900)
            const candidate = `${base || 'user'}_${randomSuffix}`
            form.setValue('username', candidate, { shouldValidate: true })
        } finally {
            setSuggesting(false)
        }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        const url = await upload(file)
        if (url) {
            form.setValue('avatar_url', url, { shouldValidate: true })
        }
    }

    // Step 1 Validation before advancing
    const canProceedStep1 = useMemo(() => {
        if (!displayNameValue || displayNameValue.trim().length === 0) return false
        if (!usernameValue || usernameValue.length < 3) return false
        if (usernameValue.startsWith('user_')) return false
        if (usernameStatus === 'taken' || usernameStatus === 'checking' || usernameStatus === 'invalid_prefix') {
            return false
        }
        return true
    }, [displayNameValue, usernameValue, usernameStatus])

    const handleNextStep1 = async () => {
        const valid = await form.trigger(['display_name', 'username'])
        if (!valid) return

        if (usernameStatus === 'taken') {
            form.setError('username', { message: 'That username is already taken.' })
            return
        }
        if (usernameStatus === 'checking') {
            toast.info('Checking username availability… please wait a moment.')
            return
        }
        if (usernameValue.startsWith('user_')) {
            form.setError('username', { message: 'Username cannot start with "user_".' })
            return
        }

        setCurrentStep(2)
    }

    const handleNextStep2 = async () => {
        const valid = await form.trigger(['profession'])
        if (!valid) return
        setCurrentStep(3)
    }

    async function onSubmit(values: FormValues) {
        if (usernameStatus === 'taken') {
            setCurrentStep(1)
            form.setError('username', {
                message: 'That username is already taken.',
            })
            return
        }

        if (usernameStatus === 'checking') {
            toast.info('Still checking username availability, please wait a moment.')
            return
        }

        setSubmitting(true)

        try {
            const result = await completeOnboarding({
                display_name: values.display_name.trim(),
                username: values.username.trim().toLowerCase(),
                bio: values.bio?.trim() || undefined,
                profession: values.profession?.trim() || undefined,
                location: values.location?.trim() || undefined,
                avatar_url: values.avatar_url || undefined,
            })

            if (result && !result.success) {
                toast.error(result.error)

                if (result.error.toLowerCase().includes('username')) {
                    setCurrentStep(1)
                    form.setError('username', {
                        message: result.error,
                    })
                }
                return
            }

            if (result?.success) {
                toast.success('Welcome to HubNovo! Profile setup complete.')
                window.location.href = '/app'
                return
            }
        } catch (err) {
            console.error('COMPLETE PROFILE ERROR:', err)
            if (err instanceof Error && !err.message.includes('NEXT_REDIRECT')) {
                toast.error(
                    err instanceof Error ? err.message : 'Something went wrong. Please try again.',
                )
            }
            throw err
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 sm:py-12">
            <div className="bento-card noise-bg w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-xl border border-border/80">
                {/* Header */}
                <div className="text-center space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        Multistep Profile Setup
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Welcome to HubNovo
                    </h1>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        Complete your 3-step profile to connect with creators, funding, jobs, and communities.
                    </p>
                </div>

                {/* Stepper Progress Bar */}
                <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className={`flex items-center gap-1.5 transition-colors ${
                                currentStep === 1
                                    ? 'text-primary font-bold'
                                    : 'hover:text-foreground'
                            }`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                                    currentStep > 1
                                        ? 'bg-primary text-primary-foreground'
                                        : currentStep === 1
                                        ? 'border-2 border-primary text-primary'
                                        : 'border border-muted text-muted-foreground'
                                }`}
                            >
                                {currentStep > 1 ? '✓' : '1'}
                            </span>
                            <span>Identity</span>
                        </button>

                        <div className="h-[2px] flex-1 mx-2 bg-muted relative overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{
                                    width: currentStep >= 2 ? '100%' : '0%',
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (canProceedStep1) setCurrentStep(2)
                            }}
                            disabled={!canProceedStep1}
                            className={`flex items-center gap-1.5 transition-colors ${
                                currentStep === 2
                                    ? 'text-primary font-bold'
                                    : currentStep > 2
                                    ? 'text-foreground'
                                    : 'text-muted-foreground opacity-60'
                            }`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                                    currentStep > 2
                                        ? 'bg-primary text-primary-foreground'
                                        : currentStep === 2
                                        ? 'border-2 border-primary text-primary'
                                        : 'border border-muted text-muted-foreground'
                                }`}
                            >
                                {currentStep > 2 ? '✓' : '2'}
                            </span>
                            <span>Photo & Role</span>
                        </button>

                        <div className="h-[2px] flex-1 mx-2 bg-muted relative overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{
                                    width: currentStep === 3 ? '100%' : '0%',
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (canProceedStep1) setCurrentStep(3)
                            }}
                            disabled={!canProceedStep1}
                            className={`flex items-center gap-1.5 transition-colors ${
                                currentStep === 3
                                    ? 'text-primary font-bold'
                                    : 'text-muted-foreground opacity-60'
                            }`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                                    currentStep === 3
                                        ? 'border-2 border-primary text-primary'
                                        : 'border border-muted text-muted-foreground'
                                }`}
                            >
                                3
                            </span>
                            <span>Bio & Review</span>
                        </button>
                    </div>
                </div>

                {/* Form Container */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
                        {/* ── STEP 1: IDENTITY & USERNAME ─────────────────────────────────── */}
                        {currentStep === 1 && (
                            <div className="space-y-5 animate-in fade-in-50 duration-300">
                                <div className="border-b border-border/60 pb-3">
                                    <h2 className="text-base font-semibold text-foreground">
                                        Step 1: Claim your identity & unique handle
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Your display name and @handle will identify you across all HubNovo features.
                                    </p>
                                </div>

                                {/* Display Name */}
                                <FormField
                                    control={form.control}
                                    name="display_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Display Name <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Chioma Okafor"
                                                    autoComplete="name"
                                                    {...field}
                                                    className="h-11"
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Your full or public name displayed on your profile, posts, and transactions.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Unique Username */}
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-sm font-medium">
                                                    Unique @Username <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateSuggestion}
                                                    disabled={suggesting}
                                                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${suggesting ? 'animate-spin' : ''}`} />
                                                    Suggest handle
                                                </button>
                                            </div>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground select-none font-medium">
                                                        @
                                                    </span>
                                                    <Input
                                                        className="pl-8 pr-10 h-11"
                                                        placeholder="chioma_builds"
                                                        autoComplete="username"
                                                        autoCapitalize="none"
                                                        autoCorrect="off"
                                                        spellCheck={false}
                                                        {...field}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                                                            )
                                                        }
                                                    />
                                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                                        {usernameStatus === 'checking' && (
                                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                        )}
                                                        {usernameStatus === 'available' && (
                                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                        )}
                                                        {(usernameStatus === 'taken' ||
                                                            usernameStatus === 'invalid_prefix') && (
                                                            <XCircle className="w-4 h-4 text-destructive" />
                                                        )}
                                                    </span>
                                                </div>
                                            </FormControl>

                                            <div className="space-y-1 mt-1">
                                                <FormDescription className="text-xs">
                                                    Letters, numbers, and underscores only. Permanent handle for tags, wallet, and profile link.
                                                </FormDescription>

                                                {usernameStatus === 'taken' && (
                                                    <p className="text-xs font-medium text-destructive">
                                                        @{usernameValue} is already claimed. Please try another handle.
                                                    </p>
                                                )}
                                                {usernameStatus === 'invalid_prefix' && (
                                                    <p className="text-xs font-medium text-destructive">
                                                        Username cannot start with &quot;user_&quot;. Please pick a personal handle.
                                                    </p>
                                                )}
                                                {usernameStatus === 'available' && (
                                                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                        ✓ @{usernameValue} is available!
                                                    </p>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        onClick={handleNextStep1}
                                        disabled={!canProceedStep1}
                                        className="w-full h-11 font-medium gap-2 text-sm"
                                    >
                                        Continue to Step 2: Photo & Role
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: PHOTO & PROFESSION ─────────────────────────────────── */}
                        {currentStep === 2 && (
                            <div className="space-y-5 animate-in fade-in-50 duration-300">
                                <div className="border-b border-border/60 pb-3">
                                    <h2 className="text-base font-semibold text-foreground">
                                        Step 2: Profile photo & professional focus
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Help other members recognize you and understand what you build or offer.
                                    </p>
                                </div>

                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/60 bg-muted/20 gap-3 text-center">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative group w-24 h-24 rounded-full border-2 border-dashed border-primary/50 hover:border-primary transition-all overflow-hidden bg-muted flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        aria-label="Upload avatar"
                                    >
                                        {preview || avatarUrlValue ? (
                                            <Image
                                                src={preview || avatarUrlValue}
                                                alt="Avatar preview"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                                <Camera className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span className="text-[10px] font-medium">Add Photo</span>
                                            </div>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            </div>
                                        )}
                                    </button>

                                    <div className="space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            {preview || avatarUrlValue ? 'Change photo' : 'Upload photo'}
                                        </button>
                                        <p className="text-[11px] text-muted-foreground">
                                            Square image recommended (JPG, PNG, WebP up to 5MB)
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

                                {/* Profession / Headline */}
                                <FormField
                                    control={form.control}
                                    name="profession"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                                                <Briefcase className="w-3.5 h-3.5 text-primary" />
                                                Profession or Title
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Software Engineer, Artisan, Product Designer…"
                                                    {...field}
                                                    className="h-11"
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Quick suggestions to choose from:
                                            </FormDescription>
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {SUGGESTED_ROLES.map((role) => (
                                                    <button
                                                        key={role}
                                                        type="button"
                                                        onClick={() =>
                                                            form.setValue('profession', role, {
                                                                shouldValidate: true,
                                                            })
                                                        }
                                                        className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                                                            field.value === role
                                                                ? 'bg-primary text-primary-foreground border-primary font-medium'
                                                                : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                                        }`}
                                                    >
                                                        {role}
                                                    </button>
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-center gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCurrentStep(1)}
                                        className="h-11 px-4 gap-1.5"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={handleNextStep2}
                                        className="flex-1 h-11 font-medium gap-2 text-sm"
                                    >
                                        Continue to Step 3: Bio & Review
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3: BIO, LOCATION & PREVIEW ─────────────────────────────── */}
                        {currentStep === 3 && (
                            <div className="space-y-5 animate-in fade-in-50 duration-300">
                                <div className="border-b border-border/60 pb-3">
                                    <h2 className="text-base font-semibold text-foreground">
                                        Step 3: About you & profile preview
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Add a short bio and location, then preview your community profile card.
                                    </p>
                                </div>

                                {/* Location */}
                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                                Location
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Lagos, Nigeria"
                                                    {...field}
                                                    className="h-11"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Bio */}
                                <FormField
                                    control={form.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-sm font-medium">Bio</FormLabel>
                                                <span
                                                    className={`text-xs ${
                                                        bioValue.length > 150
                                                            ? 'text-destructive font-semibold'
                                                            : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {bioValue.length}/160
                                                </span>
                                            </div>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Tell the HubNovo community a little about yourself, what you are working on, or what brings you here…"
                                                    className="resize-none"
                                                    rows={3}
                                                    maxLength={160}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Live Community Profile Card Preview */}
                                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                                            <BadgeCheck className="w-3.5 h-3.5" />
                                            Live Profile Preview
                                        </span>
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                            HubNovo Member
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3.5">
                                        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center shrink-0">
                                            {preview || avatarUrlValue ? (
                                                <Image
                                                    src={preview || avatarUrlValue}
                                                    alt="Avatar"
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <User className="w-6 h-6 text-muted-foreground" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <h3 className="font-semibold text-foreground text-sm truncate">
                                                    {displayNameValue || 'Your Display Name'}
                                                </h3>
                                                <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                                            </div>

                                            <p className="text-xs text-muted-foreground truncate">
                                                @{usernameValue || 'your_handle'}
                                            </p>

                                            {(professionValue || locationValue) && (
                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                                    {professionValue && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Briefcase className="w-3 h-3 text-primary/70" />
                                                            {professionValue}
                                                        </span>
                                                    )}
                                                    {locationValue && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-primary/70" />
                                                            {locationValue}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {bioValue && (
                                        <p className="text-xs text-foreground/85 italic bg-background/50 rounded-lg p-2.5 border border-border/40">
                                            &ldquo;{bioValue}&rdquo;
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCurrentStep(2)}
                                        disabled={submitting}
                                        className="h-11 px-4 gap-1.5"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={
                                            submitting ||
                                            uploading ||
                                            usernameStatus === 'taken' ||
                                            usernameStatus === 'checking'
                                        }
                                        className="flex-1 h-11 font-medium gap-2 text-sm"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Launching your profile…
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                Complete Profile & Enter HubNovo
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </Form>
            </div>
        </div>
    )
}
