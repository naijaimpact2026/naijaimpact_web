import { characterPreviewUrl, normalizeAvatar, type AvatarConfig } from '@/lib/competitions/config'

/** The participant's chosen 3D character, as its preview image. */
export default function AvatarSprite({ avatar, size = 64, className = '' }: { avatar: AvatarConfig | null | undefined; size?: number; className?: string })
{
    const { character } = normalizeAvatar(avatar)
    return (
        // eslint-disable-next-line @next/next/no-img-element -- tiny static PNG, no optimisation needed
        <img src={characterPreviewUrl(character)} alt="" width={size} height={size} className={`object-contain ${className}`} draggable={false} />
    )
}
