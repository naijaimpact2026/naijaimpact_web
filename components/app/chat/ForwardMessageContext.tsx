'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export interface ForwardMessageContextType {
  forwardMessage: any | null
  setForwardMessage: (msg: any | null) => void
}

const ForwardMessageContext = createContext<ForwardMessageContextType>({
  forwardMessage: null,
  setForwardMessage: () => {},
})

export function ForwardMessageProvider({ children }: { children: ReactNode }) {
  const [forwardMessage, setForwardMessage] = useState<any | null>(null)

  return (
    <ForwardMessageContext.Provider value={{ forwardMessage, setForwardMessage }}>
      {children}
    </ForwardMessageContext.Provider>
  )
}

export function useForwardMessage() {
  return useContext(ForwardMessageContext)
}
