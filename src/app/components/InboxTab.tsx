"use client";

import { useState } from "react";
import EmailViewer from "./EmailViewer";
import { on } from "events";

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

export default function InboxTab({ emails, loading, sendingReplyId, sendingQuickThanksId, onSendReply }: InboxTabProps) {
	const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
	if (loading) {
		return <p className="text-gray-400 p-4">Loading...</p>;
	}

	if (!emails.length) {
		return <p className="text-gray-400 p-4">No emails found</p>;
	}

	return (
		<div className="flex h-full">
			<div className="w-64 bg-gray-900 rounded-lg border-r-1 border-gray-700 h-full overflow-y-auto hide-scrollbar">
				{[...emails]
					.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
					.map((email) => (
						<div
							key={email.messageId}
							className={`p-3 cursor-pointer hover:bg-gray-800 border-b-1 border-gray-700 transition ${selectedEmail?.messageId === email.messageId ? "bg-gray-800" : ""
								}`}
							onClick={() => setSelectedEmail(email)}
						>
							<p className="text-white font-medium truncate">{email.subject}</p>
							<p className="text-gray-400 text-sm truncate ">From: {email.from}</p>
						</div>
					))}
			</div>
			{selectedEmail && (
				<div className="flex-1 px-4">
					<EmailViewer
						email={selectedEmail}
						showActions={true}
						sendingReplyId={sendingReplyId}
						sendingQuickThanksId={sendingQuickThanksId}
						onSendReply={onSendReply}
					/>
				</div>
			)}
		</div>
	);
}
