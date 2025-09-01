"use client"

import type { EmailMessage } from "@/lib/email-engine"
import InboxTab from "./InboxTab"
import SendEmailTab from "./SendEmailTab"
import { Mail } from "lucide-react"

interface TabContentProps {
  activeTab: string
  emails: EmailMessage[]
  selectedEmail: EmailMessage | null
  onEmailClick: (email: EmailMessage) => void
  loading: boolean
}

export default function TabContent({ activeTab, emails, selectedEmail, onEmailClick, loading }: TabContentProps) {
  const handleSendEmail = async (data: {
    emails: string | string[]
    subject: string
    brief: string
    format: "formal" | "casual" | "concise" | "friendly"
    action: "send" | "preview"
  }) => {
    const response = await fetch("/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    return response.json()
  }

  switch (activeTab) {
    case "inbox":
      return <InboxTab emails={emails} selectedEmail={selectedEmail} onEmailClick={onEmailClick} loading={loading} />
    case "send":
      return <SendEmailTab onSendEmail={handleSendEmail} />
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
