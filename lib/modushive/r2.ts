import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Server-only Cloudflare R2 helpers (S3-compatible). The bucket stays
 * private: browsers upload with a presigned PUT, Mux ingests with a
 * short-lived presigned GET.
 */

let client: S3Client | null = null

export function isR2Configured(): boolean
{
    return Boolean(
        process.env.R2_ACCOUNT_ID
        && process.env.R2_ACCESS_KEY_ID
        && process.env.R2_SECRET_ACCESS_KEY
        && process.env.R2_BUCKET,
    )
}

function getR2(): S3Client
{
    if (!isR2Configured()) throw new Error('Cloudflare R2 is not configured (R2_* env vars)')
    if (!client)
    {
        client = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
            // Newer SDKs add CRC32 checksum headers to presigned PUTs by
            // default, which a plain browser upload can't satisfy.
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
        })
    }
    return client
}

const bucket = () => process.env.R2_BUCKET!

export function presignUpload(key: string, contentType: string, sizeBytes?: number): Promise<string>
{
    return getSignedUrl(
        getR2(),
        new PutObjectCommand({
            Bucket: bucket(),
            Key: key,
            ContentType: contentType,
            ...(sizeBytes !== undefined ? { ContentLength: sizeBytes } : {}),
        }),
        { expiresIn: 60 * 60 }
    )
}

export function presignDownload(key: string, expiresInS = 6 * 60 * 60): Promise<string>
{
    return getSignedUrl(getR2(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: expiresInS })
}

/** Size in bytes, or null if the object doesn't exist. */
export async function getObjectSize(key: string): Promise<number | null>
{
    try
    {
        const head = await getR2().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }))
        return head.ContentLength ?? 0
    } catch
    {
        return null
    }
}

export async function deleteObject(key: string): Promise<void>
{
    await getR2().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}
