import { MarketCartProvider } from '@/components/app/market/MarketCartProvider'

export default function MarketLayout({ children }: { children: React.ReactNode })
{
    return (
        <MarketCartProvider>
            {children}
        </MarketCartProvider>
    )
}
