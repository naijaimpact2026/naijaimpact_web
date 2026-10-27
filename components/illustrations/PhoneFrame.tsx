import Image from 'next/image'

// Same device frame as AppPhoneMockup, holding a real screenshot of the app
// (captured at 390×844 in mobile view, stored in public/landing/).

interface PhoneFrameProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export default function PhoneFrame({ src, alt, className = '', priority = false }: PhoneFrameProps) {
  return (
    <div
      className={`relative w-[280px] shrink-0 rounded-[44px] bg-ink p-[10px] shadow-[0_40px_80px_-20px_rgba(11,27,46,0.35)] sm:w-[300px] ${className}`}
    >
      <div className="relative overflow-hidden rounded-[34px] bg-white">
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
          sizes="300px"
          className="block h-auto w-full"
        />
      </div>
    </div>
  )
}
