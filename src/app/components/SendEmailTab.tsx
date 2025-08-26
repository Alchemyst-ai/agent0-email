"use client";

import { useState } from "react";
import { Bot, Send } from "lucide-react";

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
					action: "preview", 
				}),
			});

			if (res.ok) {
				const data = await res.json();
				if (data.preview) {
					console.log("Generated Preview:", data.preview);
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

	const handleCopyToForm = (emailData: { to: string; subject: string; body: string }) => {
		onRecipientsChange(emailData.to);
		onSubjectChange(emailData.subject);
		onBriefChange(emailData.body);
		setShowPreview(false);
		setGeneratedEmail(null);
	};

	const handleClosePreview = () => {
		// Hide the preview modal and clear the generated email
		setShowPreview(false);
		setGeneratedEmail(null);
	};

	return (
		<div className="bg-gray-900/80 rounded-lg border border-gray-700 p-4 sm:p-6 w-full max-w-full overflow-hidden">
			<h2 className="text-2xl font-semibold text-white mb-2 flex gap-2 items-center"><Send className="w-10 h-10 p-2"/> Send <span className="italic font-serif text-sky-400">Email</span></h2>
			<div className="space-y-4 px-3 py-2">
				<div>
					<label className="block text-sm font-medium text-gray-100 mb-1 ml-1">To</label>
					<input
						className="w-full border border-gray-600 rounded-lg p-3 bg-gray-800/80 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="email@example.com"
						value={recipients}
						onChange={(e) => onRecipientsChange(e.target.value)}
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-100 mb-1 ml-1">Subject</label>
					<input
						className="w-full border border-gray-600 rounded-lg p-3 bg-gray-800/80 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Subject"
						value={subject}
						onChange={(e) => onSubjectChange(e.target.value)}
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-100 mb-1 ml-1">Brief</label>
					<textarea
						className="w-full border border-gray-600 rounded-lg p-3 bg-gray-800/80 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
						className="px-4 py-3 bg-white text-sky-500 rounded-lg hover:bg-gray-300 disabled:opacity-80 font-bold flex items-center hover:scale-95"
					>
						{generating ? (
							<>
								<span className="animate-spin mr-2">⏳</span>
								Generating...
							</>
						) : (
							<>
								<span className="mr-2"><Bot/></span>
								Generate Email
							</>
						)}
					</button>
					<button
						onClick={onSendEmail}
						disabled={loading || !recipients || !subject || !brief}
						className="px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-60 font-medium hover:scale-95"
					>
						{loading ? "Sending..." : "Send Email"}
					</button>
				</div>
			</div>

			{showPreview && generatedEmail && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
						<div className="bg-white rounded-lg shadow-lg overflow-hidden">
							<div className="flex items-center justify-between px-6 py-4 border-b">
								<div className="flex items-center gap-3">
									<Send className="w-7 h-7 text-sky-600" />
									<div>
										<div className="text-sm text-gray-500">To</div>
										<div className="font-medium text-gray-900 break-all">{generatedEmail.to}</div>
									</div>
								</div>
								<div className="flex gap-2">
									<button
										className="px-3 py-1 bg-sky-600 text-white rounded"
										onClick={() => handleSendFromPreview(generatedEmail)}
									>
										Use & Send
									</button>
									<button
										className="px-3 py-1 bg-gray-100 text-gray-800 rounded"
										onClick={() => handleCopyToForm(generatedEmail)}
									>
										Copy to form
									</button>
									<button
										className="px-3 py-1 bg-transparent text-gray-600 rounded"
										onClick={handleClosePreview}
									>
										Close
									</button>
								</div>
							</div>
							<div className="px-6 py-4">
								<div className="text-lg font-semibold text-gray-900 mb-2">{generatedEmail.subject}</div>
								<div className="text-sm text-gray-600 mb-4">Preview</div>
								<div className="prose max-w-none text-gray-800 bg-white p-4 rounded border border-gray-200 overflow-auto max-h-[60vh]" dangerouslySetInnerHTML={{ __html: generatedEmail.body }} />
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
