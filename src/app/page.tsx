"use client";

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TabContent from "./components/TabContent";
import ThreadViewer from "./components/ThreadViewer";
import { EmailMessage } from "@/lib/email-engine";

export default function Home() {
	const [activeTab, setActiveTab] = useState("inbox");
	const [emails, setEmails] = useState<EmailMessage[]>([]);
	const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
	const [threadMessages, setThreadMessages] = useState<EmailMessage[]>([]);
	const [loading, setLoading] = useState(false);

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

	useEffect(() => {
		checkEmails();
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

	return (
		<div className="flex h-screen bg-slate-50">
			{/* Left Sidebar - Inbox */}
			<div className="w-80 border-r border-slate-200 bg-white shadow-sm">
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
						/>
					</div>
				</div>
			</div>

			{/* Right Side - Thread Viewer */}
			<div className="flex-1 bg-white">
				{selectedEmail ? (
					<ThreadViewer
						email={selectedEmail}
						messages={threadMessages}
						onBack={() => {
							setSelectedEmail(null);
							setThreadMessages([]);
						}}
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
