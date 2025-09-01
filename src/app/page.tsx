"use client";

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TabContent from "./components/TabContent";
import ThreadViewer from "./components/ThreadViewer";
import PreviewEditor from "./components/PreviewEditor";
import { EmailMessage } from "@/lib/email-engine";

export default function Home() {
	const [activeTab, setActiveTab] = useState("inbox");
	const [emails, setEmails] = useState<EmailMessage[]>([]);
	const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
	const [threadMessages, setThreadMessages] = useState<EmailMessage[]>([]);
	const [loading, setLoading] = useState(false);
	const [accountEmail, setAccountEmail] = useState<string>("");
	const [previewContent, setPreviewContent] = useState<{ subject: string; html: string; text: string } | null>(null);
	const [isEditingPreview, setIsEditingPreview] = useState(false);
	const [recipients, setRecipients] = useState<string[]>([]);

	const checkEmails = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/emails?pageSize=100");
			if (!response.ok) {
				throw new Error("Failed to fetch emails");
			}
			const data = await response.json();
			setEmails(data.messages || []);
		} catch (error) {
			console.error("Error fetching emails:", error);
		} finally {
			setLoading(false);
		}
	};

	const getAccountInfo = async () => {
		try {
			const response = await fetch("/api/account");
			if (!response.ok) {
				throw new Error("Failed to fetch account info");
			}
			const data = await response.json();
			setAccountEmail(data.account);
		} catch (error) {
			console.error("Error fetching account info:", error);
		}
	};

	useEffect(() => {
		checkEmails();
		getAccountInfo();
	}, []);

	const handleEmailClick = async (email: EmailMessage) => {
		setSelectedEmail(email);
		try {
			const response = await fetch(`/api/emails/thread/${email.threadId}`);
			if (!response.ok) {
				throw new Error("Failed to fetch thread messages");
			}
			const data = await response.json();
			setThreadMessages(data.messages || []);
		} catch (error) {
			console.error("Error fetching thread messages:", error);
		}
	};

	const handlePreviewGenerated = (preview: { subject: string; html: string; text: string }) => {
		setPreviewContent(preview);
		// Extract recipients from the current form state
		// This will be handled by the SendEmailTab
		setIsEditingPreview(true);
	};

	const handleSendEmail = async (data: {
		emails: string | string[];
		subject: string;
		brief?: string;
		html?: string;
		format?: 'formal' | 'casual' | 'concise' | 'friendly';
		action: 'send' | 'preview';
	}) => {
		try {
			// Handle both data structures - from SendEmailTab and PreviewEditor
			const requestBody = {
				emails: data.emails,
				subject: data.subject,
				brief: data.brief || data.html || '', // Use brief if available, fallback to html
				format: data.format || 'friendly', // Use format if available, default to friendly
				action: data.action
			};

			const response = await fetch('/api/send', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				throw new Error('Failed to send email');
			}

			const result = await response.json();
			return result;
		} catch (error) {
			console.error('Error sending email:', error);
			throw error;
		}
	};

	return (
		<div className="flex h-screen bg-slate-50">
			{/* Left Sidebar - Inbox */}
			<div className="w-96 border-r border-slate-200 bg-white shadow-sm">
				<div className="h-full flex flex-col">
					{/* Header */}
					<div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
						<h1 className="text-xl font-semibold text-white">Email Agent</h1>
					</div>
					
					{/* Tabs */}
					<Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
					
					{/* Content */}
					<div className="flex-1 overflow-hidden">
						<TabContent 
							activeTab={activeTab}
							emails={emails}
							selectedEmail={selectedEmail}
							onEmailClick={handleEmailClick}
							loading={loading}
							onPreviewGenerated={handlePreviewGenerated}
							onSendEmail={handleSendEmail}
						/>
					</div>
				</div>
			</div>

			{/* Right Side - Thread Viewer or Preview Editor */}
			<div className="flex-1 bg-white">
				{isEditingPreview && previewContent ? (
					<PreviewEditor
						preview={previewContent}
						onSend={() => {
							setIsEditingPreview(false);
							setPreviewContent(null);
						}}
						onBack={() => {
							setIsEditingPreview(false);
							setPreviewContent(null);
						}}
						onSendEmail={handleSendEmail}
						recipients={recipients}
					/>
				) : selectedEmail ? (
					<ThreadViewer
						email={selectedEmail}
						messages={threadMessages}
						onBack={() => {
							setSelectedEmail(null);
							setThreadMessages([]);
						}}
						accountEmail={accountEmail}
					/>
				) : (
					<div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
						<div className="text-center">
							<div className="text-blue-400 text-6xl mb-4">📧</div>
							<h2 className="text-xl font-medium text-slate-700 mb-2">Select an email</h2>
							<p className="text-slate-600">Choose an email from the inbox to start reading</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
