"use client";

import { useState } from "react";
import EmailViewer from "./EmailViewer";
import { Send } from "lucide-react";

interface SendEmailTabProps {
	recipients: string;
	subject: string;
	brief: string;
	loading: boolean;
	onRecipientsChange: (value: string) => void;
	onSubjectChange: (value: string) => void;
	onBriefChange: (value: string) => void;
	onSendEmail: () => void;
}

interface GeneratedEmail {
	to: string;
	subject: string;
	body: string;
}

export default function SendEmailTab({
	recipients,
	subject,
	brief,
	loading,
	onRecipientsChange,
	onSubjectChange,
	onBriefChange,
	onSendEmail,
}: SendEmailTabProps) {
	const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [generating, setGenerating] = useState(false);

	const handleGenerateEmail = async () => {
		if (!recipients || !subject || !brief) {
			return;
		}

		setGenerating(true);
		try {
			const res = await fetch("/api/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					emails: recipients.split(/[,\n]/).map(s => s.trim()).filter(Boolean),
					subject,
					brief,
					format: "friendly",
					action: "preview", // Add this to indicate we want preview only
				}),
			});

			if (res.ok) {
				const data = await res.json();
				if (data.preview) {
					setGeneratedEmail({
						to: recipients,
						subject: data.preview.subject,
						body: data.preview.html || data.preview.text,
					});
					setShowPreview(true);
				}
			}
		} catch (error) {
			console.error("Failed to generate email:", error);
		} finally {
			setGenerating(false);
		}
	};

	const handleSendFromPreview = (emailData: { to: string; subject: string; body: string }) => {
		// Update the form with the generated content
		onRecipientsChange(emailData.to);
		onSubjectChange(emailData.subject);
		onBriefChange(emailData.body);
		setShowPreview(false);
		// Trigger the actual send
		onSendEmail();
	};

	const handleClosePreview = () => {
		setShowPreview(false);
		setGeneratedEmail(null);
	};

	return (
		<div className="bg-gray-900 rounded-lg border border-gray-700 p-4 sm:p-6 w-full max-w-full overflow-hidden">
			<h2 className="text-2xl font-semibold text-white mb-4"><Send className="w-10 h-10 p-2"/> Send Email</h2>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-200 mb-2">To</label>
					<input
						className="w-full border border-gray-600 rounded-lg p-3 bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="email@example.com"
						value={recipients}
						onChange={(e) => onRecipientsChange(e.target.value)}
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-200 mb-2">Subject</label>
					<input
						className="w-full border border-gray-600 rounded-lg p-3 bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Subject"
						value={subject}
						onChange={(e) => onSubjectChange(e.target.value)}
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-200 mb-2">Brief</label>
					<textarea
						className="w-full border border-gray-600 rounded-lg p-3 bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						rows={4}
						placeholder="Describe what you want to say..."
						value={brief}
						onChange={(e) => onBriefChange(e.target.value)}
					/>
				</div>
				<div className="flex flex-wrap gap-3">
					<button
						onClick={handleGenerateEmail}
						disabled={generating || !recipients || !subject || !brief}
						className="px-4 py-3 bg-white text-sky-500 rounded-lg hover:bg-gray-300 disabled:opacity-60 font-bold flex items-center"
					>
						{generating ? (
							<>
								<span className="animate-spin mr-2">⏳</span>
								Generating...
							</>
						) : (
							<>
								<span className="mr-2">🤖</span>
								Generate Email
							</>
						)}
					</button>
					<button
						onClick={onSendEmail}
						disabled={loading || !recipients || !subject || !brief}
						className="px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-60 font-medium"
					>
						{loading ? "Sending..." : "Send Email"}
					</button>
				</div>
			</div>

			{/* Email Preview Modal */}
			{showPreview && generatedEmail && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
						<EmailViewer
							email={generatedEmail}
							// mode="preview"
							onSend={handleSendFromPreview}
							onClose={handleClosePreview}
							loading={loading}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
