"use client";

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import MessageDisplay from "./components/MessageDisplay";
import TabContent from "./components/TabContent";
import SendEmailTab from "./components/SendEmailTab";
import { ChevronDown, SquarePen,X } from "lucide-react";

type TabType = "inbox" | "send" | "ai-replies";

type EmailMessage = {
	messageId: string;
	from: string;
	subject: string;
	body: string;
	date: string;
};

export default function Home() {
	const [showSendModal, setShowSendModal] = useState(false);
	const [activeTab, setActiveTab] = useState<TabType>("inbox");
	const [emails, setEmails] = useState<EmailMessage[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);
	const [sendingQuickThanksId, setSendingQuickThanksId] = useState<string | null>(null);
	const [isSendingEmail, setIsSendingEmail] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	// Email sending
	const [recipients, setRecipients] = useState("");
	const [subject, setSubject] = useState("");
	const [brief, setBrief] = useState("");

	// Reply
	const [replyText, setReplyText] = useState("");
	const [autoReply, setAutoReply] = useState(false);

	// Load emails on tab switch to inbox
	useEffect(() => {
		if (activeTab === "inbox") {
			checkEmails();
		}
	}, [activeTab]);

	async function checkEmails() {
		setIsRefreshing(true);
		setError("");
		try {
			const res = await fetch("/api/replies", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "check" }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to check emails");
			setEmails(data.newEmails);
			setSuccess(`Found ${data.count} emails`);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsRefreshing(false);
		}
	}

	async function sendEmail() {
		if (!recipients || !subject || !brief) {
			setError("Please fill in all fields");
			return;
		}
		
		setIsSendingEmail(true);
		setError("");
		setSuccess("");
		try {
			const res = await fetch("/api/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					emails: recipients.split(/[\,\n]/).map(s => s.trim()).filter(Boolean),
					subject,
					brief,
					format: "friendly",
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to send email");
			setSuccess("Email sent successfully!");
			setRecipients("");
			setSubject("");
			setBrief("");
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsSendingEmail(false);
		}
	}

	async function sendReply(messageId: string, customText?: string) {
		if (customText === "Thanks!") {
			setSendingQuickThanksId(messageId);
		} else {
			setSendingReplyId(messageId);
		}
		setError("");
		setSuccess("");
		try {
			const res = await fetch("/api/replies", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "reply",
					messageId,
					replyText: customText || replyText,
					autoReply: !customText && autoReply,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to send reply");
			setSuccess("Reply sent successfully!");
		} catch (err: any) {
			setError(err.message);
		} finally {
			if (customText === "Thanks!") {
				setSendingQuickThanksId(null);
			} else {
				setSendingReplyId(null);
			}
		}
	}

	return (
		<div className="h-screen bg-gray-950 flex overflow-hidden">
			<Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
			
			<div className="flex-1 px-6 overflow-y-auto">
				<div className="flex items-center justify-between py-4 px-4">
					<h1 className="text-2xl font-bold text-white">Email <span className="font-serif italic text-sky-400">Agent</span></h1>
					<div className="flex items-center gap-4">
						<MessageDisplay error={error} success={success} />
						<button
							className="px-3 py-2 flex gap-1 text-white rounded "
							onClick={() => setShowSendModal(true)}
						>
							<SquarePen/>Compose
						</button>
					</div>
				</div>

				{showSendModal && (
					<div className=" flex items-center justify-center">
						<div
							className="absolute z-60 right-10 top-40"
							onClick={() => setShowSendModal(false)}
						><X className="w-4 h-4 text-gray-200"/>
						</div>
						{/* modal card */}
						<div className="bg-gray-950 w-full max-w-3xl">
							<div className="relative shadow-xl">
								<SendEmailTab
									recipients={recipients}
									subject={subject}
									brief={brief}
									loading={isSendingEmail}
									onRecipientsChange={setRecipients}
									onSubjectChange={setSubject}
									onBriefChange={setBrief}
									onSendEmail={() => {
										setShowSendModal(false);
										sendEmail();
									}}
								/>
							</div>
						</div>
					</div>
				)}
				
				<TabContent
					activeTab={activeTab}
					emails={emails}
					isRefreshing={isRefreshing}
					sendingReplyId={sendingReplyId}
					sendingQuickThanksId={sendingQuickThanksId}
					isSendingEmail={isSendingEmail}
					recipients={recipients}
					subject={subject}
					brief={brief}
					replyText={replyText}
					autoReply={autoReply}
					onCheckEmails={checkEmails}
					onSendReply={sendReply}
					onRecipientsChange={setRecipients}
					onSubjectChange={setSubject}
					onBriefChange={setBrief}
					onSendEmail={sendEmail}
					onReplyTextChange={setReplyText}
					onAutoReplyChange={setAutoReply}
				/>
			</div>
		</div>
	);
}
