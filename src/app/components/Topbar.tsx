"use client";

import { Mail, Send, History, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts } from "@/lib/accounts-context";
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface TopbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Topbar({ activeTab, setActiveTab }: TopbarProps) {
  const tabs = [
    { id: "inbox", label: "Inbox", icon: Mail },
    { id: "send", label: "Send Email", icon: Send },
    { id: "sent", label: "Sent Emails", icon: History },
    { id: "accounts", label: "Accounts", icon: Settings },
  ];

  const { accounts, switchActiveAccount } = useAccounts();
  const activeAccount = accounts.find(a => a.isActive);
  const { theme, setTheme } = useTheme();
  return (
    <div className="w-full border-b">
      <div className="max-w-[1400px]">
        
        <div className="h-14 flex items-center gap-2 overflow-x-auto">
            {/* Header */}
        <div className="p-4 w-96 flex items-center justify-center border-b">
          <h1 className="text-xl font-semibold">Email Agent</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className="h-9 px-3"
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{tab.label}</span>
              </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 ml-auto">
            <Select
              value={activeAccount?.id || ""}
              onValueChange={async (val) => {
                if (!val || val === activeAccount?.id) return;
                await switchActiveAccount(val);
                try { window.dispatchEvent(new CustomEvent('active-account-changed')); } catch {}
              }}
            >
               <SelectTrigger className="h-8">
                <SelectValue placeholder={activeAccount?.emailId || "Select account"} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.emailId}{acc.isActive ? " (active)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}


