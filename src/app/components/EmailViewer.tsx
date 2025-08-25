"use client";

import { useState } from "react";
import { _email } from "zod/v4/core";

interface EmailViewerProps {
	email: {
		from?: string;
		subject: string;
		body: string;
		date?: string;
		messageId?: string;
	};
	onSend?: (email: { to: string; subject: string; body: string }) => void;
	onSave?: (email: { to: string; subject: string; body: string }) => void;
	onClose?: () => void;
	loading?: boolean;
	showActions?: boolean;
	onSendReply?: (messageId: string, customText?: string) => void;
	sendingReplyId?: string | null;
	sendingQuickThanksId?: string | null;
}

export default function EmailViewer({
	email,
	onClose,
	loading = false,
	showActions = true,
	onSendReply,
	sendingReplyId,
	sendingQuickThanksId,
}: EmailViewerProps) {

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

	return (
		<div className="bg-gray-900 rounded-lg border border-gray-700 px-4 sm:p-6 w-full max-w-full overflow-hidden">
			

			{/* Email Content */}
			<div className="space-y-2">
				{/* From Field (read-only) */}
				{email.from && (
					<div>
						From :
						<div className="text-white rounded-lg">
							{email.from}
						</div>
					</div>
				)}



				{/* Subject Field */}
				<div>
					Subject : {email.subject}
				</div>

				{/* Date Field (read-only) */}
				{email.date && (
					<div>
						
						<div className="text-gray-100 rounded-lg text-sm">
							Date:{new Date(email.date).toLocaleString()}
						</div>
					</div>
				)}

				{showActions && (
					<div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-600">

						{onSendReply && email.messageId && (
							<>
								<button
									onClick={() => email.messageId && onSendReply(email.messageId)}
									disabled={Boolean(sendingReplyId === email.messageId || sendingQuickThanksId === email.messageId)}
									className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm bg-sky-500 text-white rounded hover:bg-blue-700 disabled:opacity-60 font-medium whitespace-nowrap"
								>
									{sendingReplyId === email.messageId ? "Sending..." : "Reply"}
								</button>
								<button
									onClick={() => email.messageId && onSendReply(email.messageId, "Thanks!")}
									disabled={Boolean(sendingReplyId === email.messageId || sendingQuickThanksId === email.messageId)}
									className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-60 font-medium whitespace-nowrap"
								>
									{sendingQuickThanksId === email.messageId ? "Sending..." : "Quick Thanks"}
								</button>
							</>
						)}
					</div>
				)}

				{/* Body Field */}
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
					{/* <textarea
						value={email.body}
						rows={8}
						className="w-full border hide-scrollbar border-gray-600 rounded-lg p-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
						placeholder="Email content..."
					/> */}

					<div className="text-white bg-gray-800 p-3 hide-scrollbar rounded-lg max-h-160 overflow-y-auto">
						{containsHtml(email.body) && (
							<div
								dangerouslySetInnerHTML={renderHtmlContent(email.body)}
								className="prose prose-invert  max-w-none"
								style={{
									color: 'white',
									fontSize: '14px',
									lineHeight: '1.6',
								}}
							/>
						) }
					</div>
				</div>
			</div>

		</div>
	);
}
