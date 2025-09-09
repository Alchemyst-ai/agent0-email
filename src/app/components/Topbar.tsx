"use client";

import { Mail, Send, History, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts } from "@/lib/accounts-context";

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

  return (
    <div className="w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-[1400px]">
        
        <div className="h-14 flex items-center gap-2 overflow-x-auto">
            {/* Header */}
        <div className="p-4 w-96 flex items-center justify-center border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 ">
          <h1 className="text-xl font-semibold text-white">Email Agent</h1>
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
                className={
                  isActive
                    ? "h-9 px-3 bg-blue-600 hover:bg-blue-600 text-white"
                    : "h-9 px-3 text-slate-700 hover:bg-slate-100"
                }
              >
                <Icon className={isActive ? "w-4 h-4 mr-2 text-white" : "w-4 h-4 mr-2 text-slate-600"} />
                <span className="text-sm font-medium">{tab.label}</span>
              </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
            <Select
              value={activeAccount?.id || ""}
              onValueChange={async (val) => {
                if (!val || val === activeAccount?.id) return;
                await switchActiveAccount(val);
                try { window.dispatchEvent(new CustomEvent('active-account-changed')); } catch {}
              }}
            >
              <SelectTrigger className="h-8 bg-white/10  border-white/30 focus-visible:ring-white/50">
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
          </div>
        </div>
      </div>
    </div>
  );
}


