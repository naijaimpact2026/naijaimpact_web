import ChatProvider from '@/components/app/ChatProvider'

export default function ChatLayout({ children }: { children: React.ReactNode })
{
    return <ChatProvider>{children}</ChatProvider>
}
