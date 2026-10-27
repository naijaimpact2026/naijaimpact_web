'use client'

import React from 'react'
import { Forward } from 'lucide-react'
import {
  ContextMenuButton,
  QuickMessageActionsButton,
  useContextMenuContext,
  useMessageContext,
  MessageActions,
  defaultMessageActionSet,
  type MessageActionSetItem,
  type MessageActionsProps,
} from 'stream-chat-react'
import { useForwardMessage } from './ForwardMessageContext'

// 1. Dropdown Context Menu Item: "Forward Message"
export function ForwardDropdownAction() {
  const { closeMenu } = useContextMenuContext()
  const { message } = useMessageContext()
  const { setForwardMessage } = useForwardMessage()

  return (
    <ContextMenuButton
      className="str-chat__message-actions-list-item-button"
      Icon={() => <Forward className="w-4 h-4 text-primary shrink-0" />}
      onClick={() => {
        closeMenu?.()
        setForwardMessage(message)
      }}
    >
      Forward Message
    </ContextMenuButton>
  )
}

// 2. Quick Action Bar Hover Button: Forward Icon
export function QuickForwardAction() {
  const { message } = useMessageContext()
  const { setForwardMessage } = useForwardMessage()

  return (
    <QuickMessageActionsButton
      title="Forward message"
      aria-label="Forward message"
      onClick={() => setForwardMessage(message)}
    >
      <Forward className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
    </QuickMessageActionsButton>
  )
}

// 3. Assemble the enhanced messageActionSet
export const customMessageActionSet: MessageActionSetItem[] = [
  ...defaultMessageActionSet.slice(0, 2), // quick-dropdown-toggle, quick-reply
  { Component: QuickForwardAction, placement: 'quick', type: 'forward' },
  ...defaultMessageActionSet.slice(2, 6), // quick-react, dropdown-react, dropdown-reply, dropdown-quote
  { Component: ForwardDropdownAction, placement: 'dropdown', type: 'forward' },
  ...defaultMessageActionSet.slice(6), // download, pin, copyMessageText, resendMessage, edit, etc.
]

// 4. Custom MessageActions Wrapper for ComponentProvider
export function CustomMessageActions(props: MessageActionsProps) {
  return (
    <MessageActions
      {...props}
      messageActionSet={customMessageActionSet}
      disableBaseMessageActionSetFilter={false}
    />
  )
}

CustomMessageActions.displayName = 'MessageActions'
CustomMessageActions.getDialogId = MessageActions.getDialogId
