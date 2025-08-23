"use client";

import { useState, useEffect } from "react";

type EmailMessage = {
	messageId: string;
	from: string;
	subject: string;
	body: string;
	date: string;
};

export default function Home() {
	const [emails, setEmails] = useState<EmailMessage[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	// Email sending
	const [recipients, setRecipients] = useState("");
	const [subject, setSubject] = useState("");
	const [brief, setBrief] = useState("");

	// Reply
	const [replyText, setReplyText] = useState("");
	const [autoReply, setAutoReply] = useState(false);

	// Load emails on page load
	useEffect(() => {
		checkEmails();
	}, []);

	async function checkEmails() {
		setLoading(true);
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
			setLoading(false);
		}
	}

	async function sendEmail() {
		if (!recipients || !subject || !brief) {
			setError("Please fill in all fields");
			return;
		}
		
		setLoading(true);
		setError("");
		setSuccess("");
		try {
			const res = await fetch("/api/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					emails: recipients.split(/[,\n]/).map(s => s.trim()).filter(Boolean),
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
			setLoading(false);
		}
	}

	async function sendReply(messageId: string, customText?: string) {
		setLoading(true);
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
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-gray-900 p-6">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="mb-8 text-center">
					<h1 className="text-4xl font-bold text-white mb-2">Email Agent</h1>
					<p className="text-gray-300">AI-powered email management</p>
				</div>

				{/* Messages */}
				{error && (
					<div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 flex items-center">
						<span className="mr-2">⚠️</span>
						{error}
					</div>
				)}
				{success && (
					<div className="mb-4 p-4 bg-green-900/20 border border-green-800 rounded-lg text-green-400 flex items-center">
						<span className="mr-2">✅</span>
						{success}
					</div>
				)}

				{/* Check Emails - Primary Section */}
				<div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
					<div className="flex justify-between items-center mb-6">
						<div>
							<h2 className="text-2xl font-semibold text-white mb-1">📥 Inbox</h2>
							<p className="text-gray-300">Your recent emails</p>
						</div>
						<button
							onClick={checkEmails}
							disabled={loading}
							className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 font-medium flex items-center"
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
						<div className="space-y-4">
							{emails.map((email, index) => (
								<div key={index} className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 transition-colors">
									<div className="flex justify-between items-start mb-3">
										<div className="flex-1">
											<div className="font-semibold text-white text-lg mb-1">{email.subject}</div>
											<div className="text-sm text-gray-300 mb-1">From: {email.from}</div>
											<div className="text-xs text-gray-400">
												{new Date(email.date).toLocaleString()}
											</div>
										</div>
										<div className="flex space-x-2">
											<button
												onClick={() => sendReply(email.messageId)}
												disabled={loading}
												className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 font-medium"
											>
												{loading ? "Sending..." : "Reply"}
											</button>
											<button
												onClick={() => sendReply(email.messageId, "Thanks!")}
												disabled={loading}
												className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-60 font-medium"
											>
												Quick Thanks
											</button>
										</div>
									</div>
									{email.body && (
										<div className="text-sm text-gray-200 bg-gray-700 p-3 rounded-lg max-h-24 overflow-hidden">
											{email.body.length > 300 ? `${email.body.substring(0, 300)}...` : email.body}
										</div>
									)}
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<div className="text-6xl mb-4">📭</div>
							<div className="text-gray-400 text-lg mb-2">No emails found</div>
							<div className="text-gray-500">Click refresh to check for new emails</div>
						</div>
					)}
				</div>

				{/* Send Email - Secondary Section */}
				<div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
					<h2 className="text-2xl font-semibold text-white mb-4">📧 Send Email</h2>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-200 mb-2">To</label>
							<input
								className="w-full border border-gray-600 rounded-lg p-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="email@example.com"
								value={recipients}
								onChange={(e) => setRecipients(e.target.value)}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-200 mb-2">Subject</label>
							<input
								className="w-full border border-gray-600 rounded-lg p-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="Subject"
								value={subject}
								onChange={(e) => setSubject(e.target.value)}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-200 mb-2">Message</label>
							<textarea
								className="w-full border border-gray-600 rounded-lg p-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								rows={4}
								placeholder="Describe what you want to say..."
								value={brief}
								onChange={(e) => setBrief(e.target.value)}
							/>
						</div>
						<button
							onClick={sendEmail}
							disabled={loading}
							className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium"
						>
							{loading ? "Sending..." : "Send Email"}
						</button>
					</div>
				</div>

				{/* AI Reply Settings - Tertiary Section */}
				<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
					<h2 className="text-2xl font-semibold text-white mb-4">🤖 AI Reply Settings</h2>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-200 mb-2">Custom Reply</label>
							<textarea
								className="w-full border border-gray-600 rounded-lg p-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								rows={3}
								placeholder="Leave empty for AI-generated reply"
								value={replyText}
								onChange={(e) => setReplyText(e.target.value)}
								disabled={autoReply}
							/>
						</div>
						<div className="flex items-center space-x-3">
							<input
								type="checkbox"
								id="autoReply"
								checked={autoReply}
								onChange={(e) => setAutoReply(e.target.checked)}
								className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
							/>
							<label htmlFor="autoReply" className="text-sm text-gray-200">
								Use AI to generate reply automatically
							</label>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
