'use client';

import { EmailMessage } from '@/lib/email-engine';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InboxTabProps {
	emails: EmailMessage[];
	selectedEmail: EmailMessage | null;
	onEmailClick: (email: EmailMessage) => void;
	loading: boolean;
	requiresAccountSetup?: boolean;
	emailError?: string;
	onRefresh?: () => void;
	onNavigateToAccounts?: () => void;
}

export default function InboxTab({ 
	emails, 
	selectedEmail, 
	onEmailClick, 
	loading, 
	requiresAccountSetup, 
	emailError, 
	onRefresh,
	onNavigateToAccounts
}: InboxTabProps) {
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

		if (diffInHours < 24) {
			return date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
			});
		} else if (diffInHours < 168) { // 7 days
			return date.toLocaleDateString('en-US', {
				weekday: 'short',
			});
		} else {
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
			});
		}
	};

	const getPreviewText = (email: EmailMessage) => {
		return email.subject;
	};

	// Group emails by threadId; keep latest for sorting, earliest for display
	const getUniqueThreads = (emails: EmailMessage[]) => {
		const latestByThread = new Map<string, EmailMessage>();
		const earliestByThread = new Map<string, EmailMessage>();
		
		emails.forEach(email => {
			const latest = latestByThread.get(email.threadId);
			if (!latest || new Date(email.date) > new Date(latest.date)) {
				latestByThread.set(email.threadId, email);
			}
			const earliest = earliestByThread.get(email.threadId);
			if (!earliest || new Date(email.date) < new Date(earliest.date)) {
				earliestByThread.set(email.threadId, email);
			}
		});
		
		const sortedLatest = Array.from(latestByThread.values()).sort((a, b) => 
			new Date(b.date).getTime() - new Date(a.date).getTime()
		);
		return { sortedLatest, earliestByThread };
	};

	const { sortedLatest: uniqueThreads, earliestByThread } = getUniqueThreads(emails || []);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Loader2 className="w-5 h-5 animate-spin" />
					<span>Loading emails...</span>
				</div>
			</div>
		);
	}

	// Show account setup instructions
	if (requiresAccountSetup) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center max-w-md mx-auto p-6">
					<div className="text-6xl mb-4">📧</div>
					<h2 className="text-xl font-medium mb-2">No Email Account Configured</h2>
					<p className="text-muted-foreground mb-6">
						You need to add an email account to start receiving and managing emails.
					</p>
					<div className="space-y-3">
						<Button 
							onClick={onNavigateToAccounts || (() => window.location.href = '#accounts')}
							className="w-full"
						>
							Add Email Account
						</Button>
						{onRefresh && (
							<Button 
								variant="outline" 
								onClick={onRefresh}
								className="w-full"
							>
								<RefreshCw className="w-4 h-4 mr-2" />
								Refresh
							</Button>
						)}
					</div>
				</div>
			</div>
		);
	}

	// Show error state
	if (emailError) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center max-w-md mx-auto p-6">
					<div className="text-6xl mb-4">⚠️</div>
					<h2 className="text-xl font-medium mb-2">Error Loading Emails</h2>
					<p className="text-muted-foreground mb-6">{emailError}</p>
					{onRefresh && (
						<Button 
							variant="outline" 
							onClick={onRefresh}
							className="w-full"
						>
							<RefreshCw className="w-4 h-4 mr-2" />
							Try Again
						</Button>
					)}
				</div>
			</div>
		);
	}

	if (!uniqueThreads.length) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="text-6xl mb-4">📭</div>
					<h2 className="text-xl font-medium mb-2">No emails found</h2>
					<p className="text-muted-foreground">Your inbox is empty</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="p-4 border-b">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Inbox</h2>
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">
							{uniqueThreads.length} thread{uniqueThreads.length !== 1 ? 's' : ''}
						</span>
						<Button
							variant="ghost"
							onClick={() => window.location.reload()}
							className="p-2"
							title="Refresh"
						>
							<RefreshCw className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>

			{/* Email List */}
			<div className="flex-1 overflow-y-auto ">
				{uniqueThreads.map((email) => (
					<div
						key={email.threadId}
						onClick={() => onEmailClick(email)}
						className={`p-4 border-b cursor-pointer transition-all duration-200 ${
							selectedEmail?.threadId === email.threadId 
								? 'bg-accent' 
								: 'hover:bg-accent/50'
						}`}
					>
						<div className="flex items-start gap-3">
							{/* Avatar */}
							<div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium text-sm">
								{(earliestByThread.get(email.threadId)?.from.name || email.from.name).charAt(0).toUpperCase()}
							</div>

							{/* Content */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between mb-1">
									<span className="font-medium truncate">
										{earliestByThread.get(email.threadId)?.from.name || email.from.name}
									</span>
									<span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
										{formatDate(earliestByThread.get(email.threadId)?.date || email.date)}
									</span>
								</div>
								
								<div className="text-sm font-medium mb-1 truncate">
									{earliestByThread.get(email.threadId)?.subject || email.subject}
								</div>
								
								{/* <div className="text-sm text-slate-600 truncate">
									{getPreviewText(email)}
								</div> */}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}