"use client";

import { useState } from "react";
import EmailViewer from "./EmailViewer";

type EmailMessage = {
	messageId: string;
	from: string;
	subject: string;
	body: string;
	date: string;
};

interface InboxTabProps {
	emails: EmailMessage[];
	loading: boolean;
	sendingReplyId?: string | null;
	sendingQuickThanksId?: string | null;
	onCheckEmails: () => void;
	onSendReply: (messageId: string, customText?: string) => void;
}

export default function InboxTab({ emails, loading, sendingReplyId, sendingQuickThanksId, onCheckEmails, onSendReply }: InboxTabProps) {
	const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
	const [viewMode, setViewMode] = useState<"view" | "edit" | "preview">("view");

	const handleViewEmail = (email: EmailMessage) => {
		setSelectedEmail(email);
		setViewMode("view");
	};

	const handleCloseViewer = () => {
		setSelectedEmail(null);
	};

	const handleSendFromViewer = (emailData: { to: string; subject: string; body: string }) => {
		if (selectedEmail) {
			onSendReply(selectedEmail.messageId, emailData.body);
			handleCloseViewer();
		}
	};

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6 w-full max-w-full overflow-hidden">
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
				<div className="min-w-0">
					<h2 className="text-xl sm:text-2xl font-semibold text-white mb-1 truncate">📥 Inbox</h2>
					<p className="text-gray-300 text-sm">Your recent emails</p>
				</div>
				<button
					onClick={onCheckEmails}
					disabled={loading}
					className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 font-medium flex items-center justify-center text-sm sm:text-base"
				>
					{loading ? (
						<>
							<span className="animate-spin mr-2">⏳</span>
							Loading...
						</>
					) : (
						<>
							<span className="mr-2">🔄</span>
							Refresh
						</>
					)}
				</button>
			</div>

			{loading && emails.length === 0 ? (
				<div className="text-center py-12">
					<div className="animate-spin text-4xl mb-4">⏳</div>
					<div className="text-gray-400">Loading your emails...</div>
				</div>
			) : emails.length > 0 ? (
				<div className="space-y-3 w-full">
					{emails.map((email, index) => {
						const isSendingReply = sendingReplyId === email.messageId;
						const isSendingQuickThanks = sendingQuickThanksId === email.messageId;
						return (
							<div key={index} className="border border-gray-600 rounded-lg p-3 sm:p-4 hover:bg-gray-700 transition-colors w-full max-w-full overflow-hidden">
								<div className="flex flex-col gap-3 mb-3">
									<div className="flex-1 min-w-0">
										<div className="font-semibold text-white text-base sm:text-lg mb-1 break-words line-clamp-2">{email.subject}</div>
										<div className="text-sm text-gray-300 mb-1 break-words truncate">From: {email.from}</div>
										<div className="text-xs text-gray-400">
											{new Date(email.date).toLocaleString()}
										</div>
									</div>
									<div className="flex flex-wrap gap-2 w-full">
										<button
											onClick={() => handleViewEmail(email)}
											className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm bg-purple-600 text-white rounded hover:bg-purple-700 font-medium whitespace-nowrap"
										>
											View
										</button>
										<button
											onClick={() => onSendReply(email.messageId)}
											disabled={isSendingReply || isSendingQuickThanks}
											className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 font-medium whitespace-nowrap"
										>
											{isSendingReply ? "Sending..." : "Reply"}
										</button>
										<button
											onClick={() => onSendReply(email.messageId, "Thanks!")}
											disabled={isSendingReply || isSendingQuickThanks}
											className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-60 font-medium whitespace-nowrap"
										>
											{isSendingQuickThanks ? "Sending..." : "Quick Thanks"}
										</button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div className="text-center py-12">
					<div className="text-6xl mb-4">📭</div>
					<div className="text-gray-400 text-lg mb-2">No emails found</div>
					<div className="text-gray-500">Click refresh to check for new emails</div>
				</div>
			)}

			{selectedEmail && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
						<EmailViewer
							email={selectedEmail}
							mode={viewMode}
							onClose={handleCloseViewer}
							loading={sendingReplyId === selectedEmail?.messageId || sendingQuickThanksId === selectedEmail?.messageId}
							showActions={false}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
