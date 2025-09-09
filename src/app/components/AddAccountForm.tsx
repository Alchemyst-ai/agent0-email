'use client';

import { useState } from 'react';
import { useAccounts } from '@/lib/accounts-context';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Server, Loader2, X, Plus } from 'lucide-react';

interface AddAccountFormProps {
  onClose: () => void;
}

export default function AddAccountForm({ onClose }: AddAccountFormProps) {
  const { addAccount } = useAccounts();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [provider, setProvider] = useState('gmail');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced settings
  const [imapHost, setImapHost] = useState('imap.gmail.com');
  const [imapPort, setImapPort] = useState(993);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [inboxName, setInboxName] = useState('INBOX');
  const [sentBoxName, setSentBoxName] = useState('[Gmail]/Sent Mail');

  const providerConfigs = {
    gmail: {
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      inboxName: 'INBOX',
      sentBoxName: '[Gmail]/Sent Mail',
    },
    yahoo: {
      imapHost: 'imap.mail.yahoo.com',
      imapPort: 993,
      smtpHost: 'smtp.mail.yahoo.com',
      smtpPort: 587,
      inboxName: 'INBOX',
      sentBoxName: 'Sent',
    },
    outlook: {
      imapHost: 'outlook.office365.com',
      imapPort: 993,
      smtpHost: 'smtp-mail.outlook.com',
      smtpPort: 587,
      inboxName: 'INBOX',
      sentBoxName: 'Sent Items',
    },
    microsoft: {
      imapHost: 'outlook.office365.com',
      imapPort: 993,
      smtpHost: 'smtp-mail.outlook.com',
      smtpPort: 587,
      inboxName: 'INBOX',
      sentBoxName: 'Sent Items',
    },
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    if (newProvider in providerConfigs) {
      const config = providerConfigs[newProvider as keyof typeof providerConfigs];
      setImapHost(config.imapHost);
      setImapPort(config.imapPort);
      setSmtpHost(config.smtpHost);
      setSmtpPort(config.smtpPort);
      setInboxName(config.inboxName);
      setSentBoxName(config.sentBoxName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const accountData = {
      email,
      password,
      provider,
      ...(provider !== 'microsoft' && {
        providerIMAPHost: imapHost,
        providerIMAPPort: imapPort,
        providerSMTPHost: smtpHost,
        providerSMTPPort: smtpPort,
        providerInboxName: inboxName,
        providerSentBoxName: sentBoxName,
      }),
    };

    const result = await addAccount(accountData);
    
    if (result.success) {
      setSuccess('Account added successfully!');
      // Reset form
      setEmail('');
      setPassword('');
      setProvider('gmail');
      // Close form after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(result.error || 'Failed to add account');
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Email Account</h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password / App Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password or app password"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                For Gmail/Yahoo, use App Passwords for better security
              </p>
            </div>
          </div>
          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding Account...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Account
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

