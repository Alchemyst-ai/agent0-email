'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhitelistEntry {
  id: string;
  emailAddress: string;
  createdAt: string;
}

interface AutoReplyWhitelistProps {
  className?: string;
}

export default function AutoReplyWhitelist({ className = '' }: AutoReplyWhitelistProps) {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch whitelist on component mount
  useEffect(() => {
    fetchWhitelist();
  }, []);

  const fetchWhitelist = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auto-reply/whitelist');
      if (response.ok) {
        const data = await response.json();
        setWhitelist(data.whitelist || []);
      } else {
        setError('Failed to fetch whitelist');
      }
    } catch (err) {
      setError('Failed to fetch whitelist');
    } finally {
      setLoading(false);
    }
  };

  const addToWhitelist = async () => {
    if (!newEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auto-reply/whitelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailAddress: newEmail.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setWhitelist(prev => [data.entry, ...prev]);
        setNewEmail('');
        setSuccess('Email added to whitelist');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add email');
      }
    } catch (err) {
      setError('Failed to add email');
    } finally {
      setAdding(false);
    }
  };

  const removeFromWhitelist = async (emailAddress: string) => {
    setRemoving(emailAddress);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/auto-reply/whitelist/${encodeURIComponent(emailAddress)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWhitelist(prev => prev.filter(entry => entry.emailAddress !== emailAddress));
        setSuccess('Email removed from whitelist');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove email');
      }
    } catch (err) {
      setError('Failed to remove email');
    } finally {
      setRemoving(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addToWhitelist();
    }
  };

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Only emails from these addresses will receive auto-replies when auto-reply is enabled.
        </p>
      </div>

      {/* Add new email */}
      <div className="flex gap-2">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter email address to whitelist"
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
          disabled={adding}
        />
        <Button
          onClick={addToWhitelist}
          disabled={adding || !newEmail.trim()}
          className="px-4 py-2"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {/* Whitelist entries */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="ml-2">Loading whitelist...</span>
          </div>
        ) : whitelist.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No emails in whitelist</p>
            <p className="text-sm">Add email addresses to enable selective auto-reply</p>
          </div>
        ) : (
          whitelist.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">{entry.emailAddress}</p>
                <p className="text-sm text-muted-foreground">
                  Added {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                onClick={() => removeFromWhitelist(entry.emailAddress)}
                disabled={removing === entry.emailAddress}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {removing === entry.emailAddress ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
