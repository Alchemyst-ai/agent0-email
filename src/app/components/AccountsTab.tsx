'use client';

import { useState } from 'react';
import { useAccounts } from '@/lib/accounts-context';
import AddAccountForm from './AddAccountForm';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Settings,
  RefreshCw
} from 'lucide-react';

export default function AccountsTab() {
  const { accounts, loading, deleteAccount, switchActiveAccount, refreshAccounts } = useAccounts();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    const result = await deleteAccount(id);
    setDeletingId(null);

    if (!result.success) {
      alert(`Failed to delete account: ${result.error}`);
    } else {
      try {
        window.dispatchEvent(new CustomEvent('active-account-changed'));
      } catch {}
    }
  };

  const handleSwitch = async (id: string) => {
    setSwitchingId(id);
    const result = await switchActiveAccount(id);
    setSwitchingId(null);

    if (!result.success) {
      alert(`Failed to switch account: ${result.error}`);
    } else {
      try {
        window.dispatchEvent(new CustomEvent('active-account-changed'));
      } catch {}
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'gmail':
        return '📧';
      case 'yahoo':
        return '📮';
      case 'outlook':
      case 'microsoft':
        return '📬';
      default:
        return '📧';
    }
  };

  const getStatusIcon = (account: { sendingLimitExceeded: boolean; isActive: boolean }) => {
    if (account.sendingLimitExceeded) {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
    if (account.isActive) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = (account: { sendingLimitExceeded: boolean; isActive: boolean }) => {
    if (account.sendingLimitExceeded) {
      return 'Limit Exceeded';
    }
    if (account.isActive) {
      return 'Active';
    }
    return 'Inactive';
  };

  const getStatusColor = (account: { sendingLimitExceeded: boolean; isActive: boolean }) => {
    if (account.sendingLimitExceeded) {
      return 'text-yellow-600 bg-yellow-100';
    }
    if (account.isActive) {
      return 'text-green-600 bg-green-100';
    }
    return 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Email Accounts</h2>
          <p className="text-sm text-gray-600">Manage your email accounts and settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={refreshAccounts}
            variant="ghost"
            title="Refresh accounts"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Accounts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No email accounts</h3>
            <p className="text-gray-600 mb-6">Add your first email account to get started</p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add Your First Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {account.emailId}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="capitalize">{account.provider}</span>
                        <span>•</span>
                        <span>Added {new Date(account.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                    {getStatusIcon(account)}
                    
                    <Button
                      onClick={() => { if (!account.isActive) handleSwitch(account.id) }}
                      disabled={account.isActive || switchingId === account.id}
                      className={`${account.isActive ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'} px-3 py-2 rounded-md transition-colors disabled:opacity-60`}
                      title={account.isActive ? 'Active account' : 'Set as active account'}
                    >
                      {switchingId === account.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          <span className="text-sm font-medium">{account.isActive ? 'Active' : 'Set Active'}</span>
                        </div>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(account.id)}
                      disabled={deletingId === account.id}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Delete account"
                    >
                      {deletingId === account.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                    </div>
                  </div>
                </div>

                {account.sendingLimitExceeded && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        Sending limit exceeded. Please check your account settings.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddForm && (
        <AddAccountForm onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
}
