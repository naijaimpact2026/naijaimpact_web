'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle, Upload, User } from 'lucide-react'
import Image from 'next/image'

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
            /^[a-z0-9_]+$/,
            'Username: lowercase letters, numbers, and underscores only',
        ),
    bio: z.string().max(160, 'Bio must be 160 characters or fewer').optional(),
    profession: z.string().max(100).optional(),
    avatar_url: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Username uniqueness check (debounced) ────────────────────────────────────

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

function useUsernameCheck(username: string)
{
    const [status, setStatus] = useState<UsernameStatus>('idle')
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const supabase = createClient()

    useEffect(() =>
    {
        if (!username || username.length < 3)
        {
            setStatus('idle')
            return
        }

        if (timerRef.current) clearTimeout(timerRef.current)

        timerRef.current = setTimeout(async () =>
        {
            setStatus('checking')
            try
            {
                const { data, error } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', username)
                    .maybeSingle()

                if (error)
                {
                    setStatus('error')
                } else
                {
                    setStatus(data ? 'taken' : 'available')
                }
            } catch
            {
                setStatus('error')
            }
        }, 300)

        return () =>
        {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [username, supabase])

    return status
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

function useAvatarUpload()
{
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)

    const upload = useCallback(
        async (file: File): Promise<string | null> =>
        {
            setUploading(true)
            try
            {
                const formData = new FormData()
                formData.append('file', file)
                const res = await fetch('/api/upload', { method: 'POST', body: formData })
                if (!res.ok) throw new Error('Upload failed')
                const json = await res.json()
                setPreview(json.url ?? null)
                return json.url ?? null
            } catch (err)
            {
                // Upload endpoint may not be live yet (task 6). Treat as non-blocking.
                console.warn('Avatar upload skipped:', err)
                // Show local preview anyway
                setPreview(URL.createObjectURL(file))
                toast.warning('Avatar upload is not available yet. You can add one later in Settings.')
                return null
            } finally
            {
                setUploading(false)
            }
        },
        [],
    )

    return { upload, uploading, preview }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage()
{
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            display_name: '',
            username: '',
            bio: '',
            profession: '',
            avatar_url: '',
        },
    })

    const usernameValue = form.watch('username')
    const bioValue = form.watch('bio') ?? ''
    const usernameStatus = useUsernameCheck(usernameValue)
    const { upload, uploading, preview } = useAvatarUpload()
    const [submitting, setSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>)
    {
        const file = e.target.files?.[0]
        if (!file) return

        const url = await upload(file)
        if (url)
        {
            form.setValue('avatar_url', url)
        }
    }

    async function onSubmit(values: FormValues)
    {
        if (usernameStatus === 'taken')
        {
            form.setError('username', { message: 'That username is already taken.' })
            return
        }
        if (usernameStatus === 'checking')
        {
            toast.info('Still checking username availability, please wait a moment.')
            return
        }

        setSubmitting(true)
        try
        {
            const result = await completeOnboarding({
                display_name: values.display_name,
                username: values.username,
                bio: values.bio || undefined,
                profession: values.profession || undefined,
                avatar_url: values.avatar_url || undefined,
            })

            if (result && !result.success)
            {
                toast.error(result.error)
                if (result.error.toLowerCase().includes('username'))
                {
                    form.setError('username', { message: result.error })
                }
            }
            // On success the server action redirects to /app/feed
        } catch (err)
        {
            // redirect() throws; let it propagate
            if (err instanceof Error && err.message !== 'NEXT_REDIRECT')
            {
                toast.error('Something went wrong. Please try again.')
            }
            throw err
        } finally
        {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
            <div className="bento-card noise-bg w-full max-w-lg p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold text-foreground">Welcome to NaijaImpact</h1>
                    <p className="text-muted-foreground text-sm">
                        Set up your profile to get started
                    </p>
                </div>

                {/* Avatar upload */}
                <div className="flex flex-col items-center gap-3">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-24 h-24 rounded-full border-2 border-dashed border-primary/50 hover:border-primary transition-colors overflow-hidden bg-muted flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Upload avatar"
                    >
                        {preview ? (
                            <Image
                                src={preview}
                                alt="Avatar preview"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <User className="w-8 h-8 text-muted-foreground" />
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        {preview ? 'Change photo' : 'Upload photo'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        aria-label="Avatar file input"
                    />
                </div>

                {/* Form */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        {/* Display Name */}
                        <FormField
                            control={form.control}
                            name="display_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Display Name <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Amaka Obi" autoComplete="name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Username */}
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground select-none">
                                                @
                                            </span>
                                            <Input
                                                className="pl-7 pr-9"
                                                placeholder="amaka_obi"
                                                autoComplete="username"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {usernameStatus === 'checking' && (
                                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                )}
                                                {usernameStatus === 'available' && (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                )}
                                                {usernameStatus === 'taken' && (
                                                    <XCircle className="w-4 h-4 text-destructive" />
                                                )}
                                            </span>
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Lowercase letters, numbers, and underscores only
                                    </FormDescription>
                                    {usernameStatus === 'taken' && (
                                        <p className="text-xs text-destructive">That username is already taken.</p>
                                    )}
                                    {usernameStatus === 'available' && (
                                        <p className="text-xs text-green-500">Username is available!</p>
                                    )}
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
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell the community a little about yourself…"
                                            className="resize-none"
                                            rows={3}
                                            maxLength={160}
                                            {...field}
                                        />
                                    </FormControl>
                                    <div className="flex justify-end">
                                        <span className={`text-xs ${bioValue.length > 150 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                            {bioValue.length}/160
                                        </span>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Profession */}
                        <FormField
                            control={form.control}
                            name="profession"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Profession</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Software Engineer, Nurse, Entrepreneur…" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={submitting || uploading || usernameStatus === 'taken' || usernameStatus === 'checking'}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                'Complete Profile'
                            )}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    )
}
