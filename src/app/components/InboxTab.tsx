"use client";

import { useState } from "react";
import EmailViewer from "./EmailViewer";
import { Mail } from "lucide-react";


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
	onReplyTextChange: (value: string) => void;
	onAutoReplyChange: (value: boolean) => void;
	replyText: string;
	autoReply: boolean;
}

export default function InboxTab({ emails, loading, sendingReplyId, sendingQuickThanksId, onSendReply,onReplyTextChange,
					onAutoReplyChange,replyText,autoReply }: InboxTabProps) {
	const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(emails.length ? emails[0] : null);
	if (loading) {
		return <p className="text-gray-400 p-4">Loading...</p>;
	}

	if (!emails.length) {
		return <p className="text-gray-400 p-4">No emails found</p>;
	}

	return (
		<div className="flex h-full">
			
			<div className="w-32 md:w-64 pt-2 bg-gray-900 rounded-xl border-1 border-gray-800">
				<h1 className="flex p-3 font-bold text-lg gap-2 text-sky-400 italic font-serif"><Mail className="text-white"/> Inbox </h1>
			    <div className="h-full md:h-[calc(100dvh-100px)] overflow-y-auto hide-scrollbar">
				{[...emails]
					.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
					.map((email) => (
						<div
							key={email.messageId}
							className={`p-3 cursor-pointer hover:bg-gray-800 border-b-1 border-gray-800 transition ${selectedEmail?.messageId === email.messageId ? "bg-gray-800" : ""
								}`}
							onClick={() => setSelectedEmail(email)}
						>
							<p className="text-white font-medium truncate">{email.subject}</p>
							<p className="text-gray-400 text-sm truncate ">From: {email.from}</p>
						</div>
					))}
				</div>
			</div>
			{selectedEmail && (
				<div className="flex-1 pl-1">
					<EmailViewer
						email={selectedEmail}
						showActions={true}
						sendingReplyId={sendingReplyId}
						sendingQuickThanksId={sendingQuickThanksId}
						onSendReply={onSendReply}
						onReplyTextChange={onReplyTextChange}
					    onAutoReplyChange={onAutoReplyChange}
						replyText={replyText}
						autoReply={autoReply}
					/>
				</div>
			)}
		</div>
	);
}
