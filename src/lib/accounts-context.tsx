'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface EmailAccount {
  id: string;
  emailId: string;
  provider: string;
  isActive: boolean;
  sendingLimitExceeded: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddAccountData {
  email: string;
  password: string;
  provider: string;
  providerIMAPHost?: string;
  providerIMAPPort?: number;
  providerSMTPHost?: string;
  providerSMTPPort?: number;
  providerInboxName?: string;
  providerSentBoxName?: string;
  meetingLink?: string;
}

interface AccountsContextType {
  accounts: EmailAccount[];
  loading: boolean;
  addAccount: (data: AddAccountData) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (id: string) => Promise<{ success: boolean; error?: string }>;
  switchActiveAccount: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshAccounts: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.credentials || []);
      } else {
        console.error('Failed to fetch accounts');
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAccounts();
  }, []);

  const addAccount = async (data: AddAccountData) => {
    try {
      const response = await fetch('/api/accounts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Refresh accounts list
        await refreshAccounts();
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to add account' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh accounts list
        await refreshAccounts();
        return { success: true };
      } else {
        const result = await response.json();
        return { success: false, error: result.error || 'Failed to delete account' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const switchActiveAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/accounts/${id}/switch`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh accounts list
        await refreshAccounts();
        return { success: true };
      } else {
        const result = await response.json();
        return { success: false, error: result.error || 'Failed to switch account' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  return (
    <AccountsContext.Provider value={{ 
      accounts, 
      loading, 
      addAccount, 
      deleteAccount, 
      switchActiveAccount, 
      refreshAccounts 
    }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
}

