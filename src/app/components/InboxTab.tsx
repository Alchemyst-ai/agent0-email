'use client';

import { EmailMessage } from '@/lib/email-engine';
import { RefreshCw, Loader2 } from 'lucide-react';

interface InboxTabProps {
	emails: EmailMessage[];
	selectedEmail: EmailMessage | null;
	onEmailClick: (email: EmailMessage) => void;
	loading: boolean;
}

export default function InboxTab({ emails, selectedEmail, onEmailClick, loading }: InboxTabProps) {
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
		// For now, just show the subject as preview
		// Later we can extract text from the first message in thread
		return email.subject;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="flex items-center gap-2 text-slate-600">
					<Loader2 className="w-5 h-5 animate-spin" />
					<span>Loading emails...</span>
				</div>
			</div>
		);
	}

	if (!emails?.length) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="text-slate-300 text-6xl mb-4">📭</div>
					<h2 className="text-xl font-medium text-slate-600 mb-2">No emails found</h2>
					<p className="text-slate-500">Your inbox is empty</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="p-4 border-b border-slate-200 bg-white">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-slate-800">Inbox</h2>
					<button
						onClick={() => window.location.reload()}
						className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
						title="Refresh"
					>
						<RefreshCw className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Email List */}
			<div className="flex-1 overflow-y-auto">
				{emails.map((email) => (
					<div
						key={email.id}
						onClick={() => onEmailClick(email)}
						className={`p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 ${
							selectedEmail?.id === email.id 
								? 'bg-blue-50 border-blue-200 shadow-sm' 
								: 'hover:bg-slate-50 hover:border-slate-200'
						}`}
					>
						<div className="flex items-start gap-3">
							{/* Avatar */}
							<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
								{email.from.name.charAt(0).toUpperCase()}
							</div>

							{/* Content */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between mb-1">
									<span className="font-medium text-slate-800 truncate">
										{email.from.name}
									</span>
									<span className="text-xs text-slate-500 whitespace-nowrap ml-2">
										{formatDate(email.date)}
									</span>
								</div>
								
								<div className="text-sm font-medium text-slate-900 mb-1 truncate">
									{email.subject}
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
