"use client";

import { useState } from "react";

interface EmailViewerProps {
	email: {
		from?: string;
		to?: string;
		subject: string;
		body: string;
		date?: string;
		messageId?: string;
	};
	mode: "view" | "edit" | "preview";
	onSend?: (email: { to: string; subject: string; body: string }) => void;
	onSave?: (email: { to: string; subject: string; body: string }) => void;
	onClose?: () => void;
	loading?: boolean;
	showActions?: boolean;
}

export default function EmailViewer({
	email,
	mode,
	onSend,
	onSave,
	onClose,
	loading = false,
	showActions = true,
}: EmailViewerProps) {
	const [isEditing, setIsEditing] = useState(mode === "edit");
	const [editedEmail, setEditedEmail] = useState({
		to: email.to || "",
		subject: email.subject,
		body: email.body,
	});

	const renderHtmlContent = (htmlContent: string) => {
		const sanitizedHtml = htmlContent
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
			.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
			.replace(/javascript:/gi, '')
			.replace(/on\w+\s*=/gi, '')
			.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
			.replace(/<embed\b[^<]*>/gi, '');

		return { __html: sanitizedHtml };
	};

	const containsHtml = (text: string) => {
		return /<[^>]*>/g.test(text);
	};

	const handleSend = () => {
		if (onSend) {
			onSend(editedEmail);
		}
	};

	const handleSave = () => {
		if (onSave) {
			onSave(editedEmail);
		}
	};

	const handleEdit = () => {
		setIsEditing(true);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditedEmail({
			to: email.to || "",
			subject: email.subject,
			body: email.body,
		});
	};

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6 w-full max-w-full overflow-hidden">
			<div className="flex justify-between items-center mb-4">
				<div className="flex items-center space-x-2">
					<span className="text-lg">
						{mode === "view" ? "📧" : mode === "edit" ? "✏️" : "👁️"}
					</span>
					<h3 className="text-lg font-semibold text-white">
						{mode === "view" ? "Email Details" : mode === "edit" ? "Edit Email" : "Email Preview"}
					</h3>
				</div>
				{onClose && (
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						✕
					</button>
				)}
			</div>

			{/* Email Content */}
			<div className="space-y-4">
				{/* From Field (read-only) */}
				{email.from && (
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-1">From</label>
						<div className="text-white bg-gray-700 p-3 rounded-lg">
							{email.from}
						</div>
					</div>
				)}

				{/* To Field */}
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-1">To</label>
					{isEditing ? (
						<input
							type="email"
							value={editedEmail.to}
							onChange={(e) => setEditedEmail({ ...editedEmail, to: e.target.value })}
							className="w-full border border-gray-600 rounded-lg p-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="recipient@example.com"
						/>
					) : (
						<div className="text-white bg-gray-700 p-3 rounded-lg">
							{email.to || "Not specified"}
						</div>
					)}
				</div>

				{/* Subject Field */}
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
					{isEditing ? (
						<input
							type="text"
							value={editedEmail.subject}
							onChange={(e) => setEditedEmail({ ...editedEmail, subject: e.target.value })}
							className="w-full border border-gray-600 rounded-lg p-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Email subject"
						/>
					) : (
						<div className="text-white bg-gray-700 p-3 rounded-lg font-medium">
							{email.subject}
						</div>
					)}
				</div>

				{/* Date Field (read-only) */}
				{email.date && (
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
						<div className="text-gray-300 bg-gray-700 p-3 rounded-lg text-sm">
							{new Date(email.date).toLocaleString()}
						</div>
					</div>
				)}

				{/* Body Field */}
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
					{isEditing ? (
						<textarea
							value={editedEmail.body}
							onChange={(e) => setEditedEmail({ ...editedEmail, body: e.target.value })}
							rows={8}
							className="w-full border border-gray-600 rounded-lg p-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
							placeholder="Email content..."
						/>
					) : (
						<div className="text-white bg-gray-700 p-3 rounded-lg max-h-96 overflow-y-auto">
							{containsHtml(email.body) ? (
								<div 
									dangerouslySetInnerHTML={renderHtmlContent(email.body)}
									className="prose prose-invert max-w-none"
									style={{
										color: 'white',
										fontSize: '14px',
										lineHeight: '1.6',
									}}
								/>
							) : (
								<div className="whitespace-pre-wrap">
									{email.body}
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Actions */}
			{showActions && (
				<div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-600">
					{mode === "view" && (
						<>
							<button
								onClick={handleEdit}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
							>
								✏️ Edit
							</button>
							{onSend && (
								<button
									onClick={handleSend}
									disabled={loading}
									className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 font-medium"
								>
									{loading ? "Sending..." : "📤 Send"}
								</button>
							)}
						</>
					)}

					{mode === "edit" && (
						<>
							<button
								onClick={handleSave}
								disabled={loading}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 font-medium"
							>
								💾 Save
							</button>
							<button
								onClick={handleCancel}
								className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
							>
								❌ Cancel
							</button>
						</>
					)}

					{mode === "preview" && onSend && (
						<button
							onClick={handleSend}
							disabled={loading}
							className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 font-medium"
						>
							{loading ? "Sending..." : "📤 Send Email"}
						</button>
					)}

					{onClose && (
						<button
							onClick={onClose}
							className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
						>
							Close
						</button>
					)}
				</div>
			)}
		</div>
	);
}
