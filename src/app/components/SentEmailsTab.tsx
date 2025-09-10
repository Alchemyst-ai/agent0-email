'use client';

import { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, XCircle, Eye, Send, Bot } from 'lucide-react';
import { EmailRecord } from '@/lib/email-db';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SentEmailsTabProps {
  selectedEmail: EmailRecord | null;
  onEmailClick: (email: EmailRecord) => void;
}

export default function SentEmailsTab({ selectedEmail, onEmailClick }: SentEmailsTabProps) {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });

  useEffect(() => {
    fetchSentEmails();
  }, [filters]);

  const fetchSentEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      
      const response = await fetch(`/api/emails/sent?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails);
      } else {
        setError('Failed to fetch sent emails');
      }
    } catch (err) {
      setError('Error fetching sent emails');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'opened':
        return <Eye className="w-4 h-4 text-purple-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'auto-reply':
        return <Bot className="w-4 h-4 text-orange-500" />;
      case 'manual-reply':
        return <Mail className="w-4 h-4 text-blue-500" />;
      default:
        return <Send className="w-4 h-4 text-green-500" />;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <XCircle className="w-6 h-6 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with filters */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sent Emails</h2>
          <div className="flex gap-2">
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="h-8 px-3 py-1">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sent">New Emails</SelectItem>
                <SelectItem value="manual-reply">Manual Replies</SelectItem>
                <SelectItem value="auto-reply">Auto Replies</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="h-8 px-3 py-1">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Mail className="w-8 h-8 mr-2" />
            No sent emails found
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email._id?.toString() || email.messageId}
              onClick={() => onEmailClick(email)}
              className={`p-4 border-b cursor-pointer transition-all duration-200 ${
                selectedEmail?._id?.toString() === email._id?.toString()
                  ? 'bg-accent'
                  : 'hover:bg-accent/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Type and Status Icons */}
                <div className="flex flex-col items-center gap-1">
                  {getTypeIcon(email.type)}
                  {getStatusIcon(email.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">
                      To: {email.to.join(', ')}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDate(email.timestamp)}
                    </span>
                  </div>

                  <div className="text-sm font-medium mb-1 truncate">
                    {email.subject}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`px-2 py-1 rounded-full ${
                      email.type === 'auto-reply' ? 'bg-orange-100 text-orange-700' :
                      email.type === 'manual-reply' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {email.type.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full ${
                      email.status === 'opened' ? 'bg-purple-100 text-purple-700' :
                      email.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      email.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {email.status}
                    </span>
                    {email.metadata.aiGenerated && (
                      <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                        AI Generated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
