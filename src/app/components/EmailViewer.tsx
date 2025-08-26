"use client";

import { useState } from "react";
import { _email } from "zod/v4/core";
import AiRepliesTab from "./AiRepliesTab";
import { Bot } from "lucide-react";

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
	replyText: string;
	autoReply: boolean;
	loading?: boolean;
	showActions?: boolean;
	onSendReply?: (messageId: string, customText?: string) => void;
	sendingReplyId?: string | null;
	sendingQuickThanksId?: string | null;
	onReplyTextChange: (value: string) => void;
	onAutoReplyChange: (value: boolean) => void;
}

export default function EmailViewer({
	email,
	onClose,
	loading = false,
	replyText,
	autoReply,
	showActions = true,
	onSendReply,
	sendingReplyId,
	sendingQuickThanksId,
	onReplyTextChange,
	onAutoReplyChange,
}: EmailViewerProps) {

	const [showAiReplies, setShowAiReplies] = useState(false);

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
		<div className="bg-gray-900 rounded-r-lg border border-gray-800 sm:p-6 w-full max-w-full overflow-hidden">

            <div className="bg-gray-950 rounded-lg p-4 sm:p-6 w-full max-w-full overflow-hidden">
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
				
                {showAiReplies && (
					<div className="w-full mt-4 ">
						<AiRepliesTab
							replyText={replyText}
							autoReply={autoReply}
							onReplyTextChange={onReplyTextChange}
							onAutoReplyChange={onAutoReplyChange}
						/>
					</div>
				)}

				{showActions && (
					<div className="flex flex-wrap gap-3 py-4 ">

						{onSendReply && email.messageId && (
							<>
							    <button
									onClick={() => email.messageId && onSendReply(email.messageId, "Thanks!")}
									disabled={Boolean(sendingReplyId === email.messageId || sendingQuickThanksId === email.messageId)}
									className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 text-sky-500 font-semibold rounded hover:bg-gray-100/90 disabled:opacity-60 whitespace-nowrap hover:scale-95"
								>
									{sendingQuickThanksId === email.messageId ? "Sending..." : "Quick Thanks"}
								</button>
								{showAiReplies &&(<button
									onClick={()=>email.messageId && onSendReply(email.messageId)}
									disabled={Boolean(sendingReplyId === email.messageId || sendingQuickThanksId === email.messageId)}
									className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-60 font-semibold whitespace-nowrap hover:scale-95"
								>
									{sendingReplyId === email.messageId ? "Sending..." : "AI Reply"}
								</button>)
                                }
								
				                <button onClick={()=>setShowAiReplies(!showAiReplies)}>
									<Bot/>
								</button>
							</>
						)}

						
					</div>
				)}

				{/* Body Field */}
				<div>
					<label className="block text-md font-medium text-gray-300 mb-4">Message</label>

					<div className="text-white bg-gray-950 p-4 border-1 border-gray-700 hide-scrollbar rounded-lg max-h-160 overflow-y-auto">
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
							<div className="text-sm whitespace-pre-wrap" style={{ color: 'white', fontSize: '14px', lineHeight: '1.6' }}>
								{email.body}
							</div>
						)}
					</div>
				</div>
			</div>
            </div>
		</div>
	);
}
