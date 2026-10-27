'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2 } from 'lucide-react'
import
    {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from '@/components/ui/dialog'
import
    {
        Form,
        FormControl,
        FormField,
        FormItem,
        FormLabel,
        FormMessage,
    } from '@/components/ui/form'
import
    {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MediaUploader, type UploadedFile } from '@/components/app/MediaUploader'
import { fileClaim } from '@/lib/actions/fintech/insure'

// ─── Schema ───────────────────────────────────────────────────────────────────

const fileClaimSchema = z.object({
    policy_id: z.string().min(1, 'Please select a policy.'),
    description: z.string().min(20, 'Description must be at least 20 characters.').max(2000),
})

type FileClaimFormValues = z.infer<typeof fileClaimSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface FileClaimModalProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    activePolicies: { id: string; name: string }[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FileClaimModal({
    open,
    onOpenChange,
    activePolicies,
}: FileClaimModalProps)
{
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [success, setSuccess] = useState(false)

    const form = useForm<FileClaimFormValues>({
        resolver: zodResolver(fileClaimSchema),
        defaultValues: {
            policy_id: activePolicies[0]?.id ?? '',
            description: '',
        },
    })

    function handleUploadComplete(files: UploadedFile[])
    {
        setUploadedFiles(files)
    }

    async function onSubmit(values: FileClaimFormValues)
    {
        form.clearErrors('root')

        const result = await fileClaim({
            policy_id: values.policy_id,
            description: values.description,
            document_urls: uploadedFiles.map((f) => f.secure_url),
        })

        if (!result.success)
        {
            form.setError('root', { message: result.error })
            return
        }

        setSuccess(true)
        setTimeout(() =>
        {
            onOpenChange(false)
            setSuccess(false)
            form.reset()
            setUploadedFiles([])
        }, 2000)
    }

    function handleClose(open: boolean)
    {
        if (!open)
        {
            form.reset()
            setUploadedFiles([])
            setSuccess(false)
        }
        onOpenChange(open)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>File a Claim</DialogTitle>
                    <DialogDescription>
                        Describe your claim and attach supporting documents.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="py-8 text-center space-y-2">
                        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                        <p className="font-semibold text-emerald-600">Claim submitted successfully!</p>
                        <p className="text-sm text-muted-foreground">
                            Our team will review your claim and get back to you.
                        </p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            {/* Policy selector */}
                            <FormField
                                control={form.control}
                                name="policy_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Policy</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a policy" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {activePolicies.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe what happened and why you're filing this claim…"
                                                className="min-h-[120px] resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Document upload */}
                            <div className="space-y-2">
                                <p className="text-sm font-medium leading-none">Supporting Documents</p>
                                <p className="text-xs text-muted-foreground">
                                    Upload photos, receipts, or other evidence (optional but recommended).
                                </p>
                                <MediaUploader
                                    onUploadComplete={handleUploadComplete}
                                    maxImages={5}
                                    maxVideos={0}
                                />
                            </div>

                            {/* Root error */}
                            {form.formState.errors.root && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.root.message}
                                </p>
                            )}

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full gradient-primary text-white"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Submitting…
                                    </>
                                ) : (
                                    'Submit Claim'
                                )}
                            </Button>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    )
}
