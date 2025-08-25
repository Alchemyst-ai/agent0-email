"use client";

import InboxTab from "./InboxTab";
import SendEmailTab from "./SendEmailTab";
import AiRepliesTab from "./AiRepliesTab";

type TabType = "inbox" | "send" | "ai-replies";

type EmailMessage = {
	messageId: string;
	from: string;
	subject: string;
	body: string;
	date: string;
};

interface TabContentProps {
	activeTab: TabType;
	emails: EmailMessage[];
	isRefreshing: boolean;
	sendingReplyId: string | null;
	sendingQuickThanksId: string | null;
	isSendingEmail: boolean;
	recipients: string;
	subject: string;
	brief: string;
	replyText: string;
	autoReply: boolean;
	onCheckEmails: () => void;
	onSendReply: (messageId: string, customText?: string) => void;
	onRecipientsChange: (value: string) => void;
	onSubjectChange: (value: string) => void;
	onBriefChange: (value: string) => void;
	onSendEmail: () => void;
	onReplyTextChange: (value: string) => void;
	onAutoReplyChange: (value: boolean) => void;
}

export default function TabContent({
	activeTab,
	emails,
	isRefreshing,
	sendingReplyId,
	sendingQuickThanksId,
	isSendingEmail,
	recipients,
	subject,
	brief,
	replyText,
	autoReply,
	onCheckEmails,
	onSendReply,
	onRecipientsChange,
	onSubjectChange,
	onBriefChange,
	onSendEmail,
	onReplyTextChange,
	onAutoReplyChange,
}: TabContentProps) {
	switch (activeTab) {
		case "inbox":
			return (
				<InboxTab
					emails={emails}
					loading={isRefreshing}
					sendingReplyId={sendingReplyId}
					sendingQuickThanksId={sendingQuickThanksId}
					onCheckEmails={onCheckEmails}
					onSendReply={onSendReply}
				/>
			);
		case "send":
			return (
				<SendEmailTab
					recipients={recipients}
					subject={subject}
					brief={brief}
					loading={isSendingEmail}
					onRecipientsChange={onRecipientsChange}
					onSubjectChange={onSubjectChange}
					onBriefChange={onBriefChange}
					onSendEmail={onSendEmail}
				/>
			);
		case "ai-replies":
			return (
				<AiRepliesTab
					replyText={replyText}
					autoReply={autoReply}
					onReplyTextChange={onReplyTextChange}
					onAutoReplyChange={onAutoReplyChange}
				/>
			);
		default:
			return null;
	}
}
