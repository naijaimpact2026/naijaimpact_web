import Image from 'next/image'

// Same device frame as AppPhoneMockup, holding a real screenshot of the app
// (captured at 390×844 in mobile view, stored in public/landing/).
// To show only the top half of the phone, wrap it in a fixed-height,
// overflow-hidden container.

interface PhoneFrameProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
  size?: 'md' | 'sm'
  /** Hide the app's own top bar (menu, logo, search) so the screen content shows first */
  hideAppBar?: boolean
}

const sizes = {
  md: {
    frame: 'w-[280px] rounded-[44px] p-[10px] sm:w-[300px]',
    screen: 'rounded-[34px]',
    imgSizes: '300px',
  },
  sm: {
    frame: 'w-[220px] rounded-[36px] p-[8px]',
    screen: 'rounded-[28px]',
    imgSizes: '220px',
  },
}

export default function PhoneFrame({
  src,
  alt,
  className = '',
  priority = false,
  size = 'md',
  hideAppBar = false,
}: PhoneFrameProps) {
  const s = sizes[size]
  return (
    <div
      className={`relative shrink-0 bg-ink shadow-[0_40px_80px_-20px_rgba(11,27,46,0.35)] ${s.frame} ${className}`}
    >
      <div className={`relative overflow-hidden bg-white ${s.screen}`}>
        {/* status bar */}
        <div className="flex items-center justify-between bg-white px-6 pb-1 pt-3 text-[10px] font-semibold text-ink">
          <span>9:41</span>
          <span className="h-[18px] w-[72px] rounded-full bg-ink" />
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-3 rounded-sm bg-ink" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink" />
          </span>
        </div>
        <Image
          src={src}
          alt={alt}
          width={390}
          height={844}
          priority={priority}
          sizes={s.imgSizes}
          className="block h-auto w-full"
          // The app bar is the top ~16% of the screenshot's width (127px of 780px).
          // Percentage margins resolve against width, so this crops it at any size.
          style={hideAppBar ? { marginTop: '-16.3%' } : undefined}
        />
      </div>
    </div>
  )
}
