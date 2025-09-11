"use client"

import type { EmailMessage } from "@/lib/email-engine"
import type { EmailRecord } from "@/lib/email-db"
import InboxTab from "./InboxTab"
import SendEmailTab from "./SendEmailTab"
import SentEmailsTab from "./SentEmailsTab"
import AccountsTab from "./AccountsTab"
import AutoReplyWhitelist from "./AutoReplyWhitelist"
import { Mail, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface TabContentProps {
  activeTab: string
  emails: EmailMessage[]
  selectedEmail: EmailMessage | null
  onEmailClick: (email: EmailMessage) => void
  loading: boolean
  onPreviewGenerated?: (preview: { subject: string; html: string; text: string }) => void
  onSendEmail?: (data: {
    emails: string | string[]
    subject: string
    brief: string
    format: "formal" | "casual" | "concise" | "friendly"
    action: "send" | "preview"
  }) => Promise<{ ok: boolean; error?: string; preview?: { subject: string; html: string; text: string } }>
  requiresAccountSetup?: boolean
  emailError?: string
  onRefresh?: () => void
  onNavigateToAccounts?: () => void
}

export default function TabContent({ 
  activeTab, 
  emails, 
  selectedEmail, 
  onEmailClick, 
  loading, 
  onPreviewGenerated,
  onSendEmail,
  requiresAccountSetup,
  emailError,
  onRefresh,
  onNavigateToAccounts
}: TabContentProps) {
  // Auto-reply toggle state (used when auto-reply tab is active)
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [loadingToggle, setLoadingToggle] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/auto-reply/toggle')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setAutoReplyEnabled(!!data.enabled)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const handleAutoReplyToggle = async (enabled: boolean) => {
    setLoadingToggle(true)
    try {
      const res = await fetch('/api/auto-reply/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      if (res.ok) setAutoReplyEnabled(enabled)
    } catch {} finally {
      setLoadingToggle(false)
    }
  }
  const handleSendEmail = async (data: {
    emails: string | string[]
    subject: string
    brief: string
    format: "formal" | "casual" | "concise" | "friendly"
    action: "send" | "preview"
  }) => {
    if (data.action === 'preview') {
      // For preview, call the API directly and then trigger the preview callback
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.preview && onPreviewGenerated) {
        onPreviewGenerated(result.preview);
      }
      return result;
    } else {
      // For send actions, use the main page's handler if available
      return await onSendEmail?.(data) || await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then(res => res.json());
    }
  }

  const handleSentEmailClick = (email: EmailRecord) => {
    // For sent emails, we can show details but they're not editable
    console.log('Sent email clicked:', email);
  }

  switch (activeTab) {
    case "inbox":
      return (
        <InboxTab 
          emails={emails} 
          selectedEmail={selectedEmail} 
          onEmailClick={onEmailClick} 
          loading={loading}
          requiresAccountSetup={requiresAccountSetup}
          emailError={emailError}
          onRefresh={onRefresh}
          onNavigateToAccounts={onNavigateToAccounts}
        />
      )
    case "send":
      return <SendEmailTab onSendEmail={handleSendEmail} />
    case "sent":
      return <SentEmailsTab selectedEmail={null} onEmailClick={handleSentEmailClick} />
    case "accounts":
      return <AccountsTab />
    case "auto-reply":
      return (
        <div className="p-4 space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold">Auto Reply</h2>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoReplyEnabled}
              onChange={(e) => handleAutoReplyToggle(e.target.checked)}
              disabled={loadingToggle}
              className="w-4 h-4 rounded focus:ring-2"
            />
            <span className="text-sm font-medium">Enable Auto-Reply</span>
            {loadingToggle && <Loader2 className="w-4 h-4 animate-spin" />}
          </label>
          <AutoReplyWhitelist />
        </div>
      )
    default:
      return (
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-8 w-8" aria-hidden="true" />
            <span className="sr-only">Mail icon</span>
          </div>
          <h2 className="text-xl font-medium text-foreground mb-1">Select a tab</h2>
          <p className="text-foreground/70">Choose an option from the sidebar</p>
        </div>
      )
  }
}
