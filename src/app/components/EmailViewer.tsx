"use client";

import { useState } from "react";
import AiRepliesTab from "./AiRepliesTab";
import { Heart, Reply, Send, ChevronUp, ChevronDown, EllipsisVertical,MessageSquareText } from "lucide-react";

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
	const [showThread, setShowThread] = useState(false);
	const [expandedReplies, setExpandedReplies] = useState(new Set());
	const [openReplySettings, setAutoReplySettings] = useState(false);
    const [autoReplyEnabled, setAutoReply] = useState(false); //for auto-reply when you recieve a new mail

	const toggleExpand = (id: string) => {
		setExpandedReplies(prev => {
			const newSet = new Set(prev);
			if (newSet.has(id)) {
				newSet.delete(id);
			} else {
				newSet.add(id);
			}
			return newSet;
		});
	};


	// Mock replies for UI preview when backend data isn't available
	const mockReplies: Array<{ id: string; author: string; date: string; body: string }> = [
		{
			id: 'r1',
			author: email.from || 'alice@example.com',
			date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
			body: 'Thanks for the update — I reviewed and this looks good to me. Let me know if you need anything else.'
		},
		{
			id: 'r2',
			author: 'you@example.com',
			date: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
			body: "Appreciate the quick response. I'll follow up with next steps by EOD."
		}
	];

	function FormatDate(emailDate: Date) {
		const now = new Date();

		const isToday =
			emailDate.getDate() === now.getDate() &&
			emailDate.getMonth() === now.getMonth() &&
			emailDate.getFullYear() === now.getFullYear();

		const optionsToday: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
		const optionsOtherDay: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' };

		return isToday
			? emailDate.toLocaleTimeString(undefined, optionsToday)
			: emailDate.toLocaleString(undefined, optionsOtherDay);
	}


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
		<div className="bg-gray-900 rounded-xl border border-gray-800 sm:p-4 w-full max-w-full overflow-hidden">
			<div className="bg-gray-950 rounded-lg p-4 sm:p-6 w-full max-w-full overflow-hidden">
				<div className="space-y-1 text-white ">
					<div className="flex justify-between items-center mb-2">
						<div>
							<div className="text-white px-1 text-lg font-semibold">
								{email.subject}
							</div>


							{email.from && (
								<div className="rounded-lg px-1 pt-0.5 flex gap-2">
									<span className="text-sky-500 text-md">From :</span>
									<div className="text-gray-300 bg-gray-900/70 text-xs border-1 border-gray-800 rounded-full py-1 px-2">{email.from}</div>
								</div>
							)}
						</div>
						<div>
							{email.date && (
								<div className="text-gray-400 rounded-lg text-sm px-1 text-right">
									{FormatDate(new Date(email.date))}
								</div>
							)}
		                    <div className="flex items-center justify-end">
							<div onClick={() => setShowAiReplies(!showAiReplies)} className="flex gap-2 justify-end">
								<button className="flex gap-1"><Reply className="w-5 h-5"/>reply</button>
							</div>
							<div className="flex flex-col relative ">
								<button onClick={() => setAutoReplySettings(prev => !prev)}>
									<EllipsisVertical className="w-5 h-5 text-gray-200 hover:text-gray-300" />
								</button>
								<div>
								{openReplySettings && (
									<div className="absolute mt-2 top-full w-50 p-1 px-2 right-0 bg-gray-900/80 rounded-lg curoser-pointer">
										<ul>
											 <li className="flex gap-3">
											<button
											onClick={() => setAutoReply(!autoReplyEnabled)}
											className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ${
												autoReply ? "bg-sky-600" : "bg-gray-950/60"
											}`}
											>
											<span
												className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
												autoReplyEnabled ? "translate-x-6" : "translate-x-1"
												}`}
											/>
											</button>
											<label htmlFor="toggleAutoReply" className="text-sm text-gray-200">
											Enable Auto Reply
											</label>
										</li>
										</ul>
									</div>
								)}
								</div>
							</div>
					
							</div>
						</div>
					</div>


					{/* <SendEmailTab
					recipients={recipients}
					subject={subject}
					brief={brief}
					loading={isSendingEmail}
					onRecipientsChange={onRecipientsChange}
					onSubjectChange={onSubjectChange}
					onBriefChange={onBriefChange}
					onSendEmail={onSendEmail}
				/> */}
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
								{onSendReply && showAiReplies && email.messageId && (
									<>
										<button
										onClick={() => email.messageId && onSendReply(email.messageId, "Thanks!")}
										disabled={Boolean(sendingReplyId === email.messageId || sendingQuickThanksId === email.messageId)}
										className="flex-1 sm:flex-none px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 text-sky-500 font-semibold rounded hover:bg-gray-100/90 disabled:opacity-60 whitespace-nowrap hover:scale-95"
									>
										{sendingQuickThanksId === email.messageId ? "Sending..." : "Quick Thanks"}
									</button>
									<button
											onClick={() => email.messageId && onSendReply(email.messageId)}
											disabled={Boolean(sendingReplyId === email.messageId || sendingQuickThanksId === email.messageId)}
											className="flex-1 gap-1 sm:flex-none px-2 sm:px-3 py-1 text-xs sm:text-sm bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-60 font-semibold whitespace-nowrap hover:scale-95"
										>
											<div className="flex items-center justify-center gap-1">
												<Send />{sendingReplyId === email.messageId ? "Sending..." : "Send"}
											</div>
										</button>
									</>
								)}
							</div>
					)}

					{/* Reply thread (collapsible preview with mock data) */}
							<div className="my-3">
								<div className="flex items-center gap-1 px-1 ">
									<div className="text-md text-gray-200 pr-1 font-medium">Replies</div>
									<button
										className="flex items-center gap-2 text-xs text-gray-200 px-2 py-1 bg-gray-800/60 cursor-pointer rounded hover:bg-gray-800/70"
										onClick={() => setShowThread(!showThread)}
									>
										<span className="text-gray-300 ">{showThread ? '' : `${mockReplies.length}`}</span>
										{showThread ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
									</button>
								</div>

								{showThread && (
									<div className="mt-1 bg-gray-950 border-l-1 border-gray-700 rounded-lg p-3">
										{mockReplies.map((r) => {
											const isExpanded = expandedReplies.has(r.id);

											return (
												<div key={r.id} className="p-2 py-3 last:mb-0 last:border-0 border-b-1 hover:bg-gray-900/50 border-gray-700">
													<div className="flex items-start justify-between cursor-pointer" onClick={() => toggleExpand(r.id)}>
														<div>
															<div className="text-sm text-gray-200 font-medium">{r.author}</div>
															<div className="text-xs text-gray-400">{FormatDate(new Date(r.date))}</div>
														</div>
														<div className="text-xs text-gray-400 ml-2">{isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}</div>
													</div>

													{isExpanded && (
														<div className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
															{containsHtml(r.body) ? (
																<div dangerouslySetInnerHTML={{ __html: r.body }} />
															) : (
																<div>{r.body}</div>
															)}
														</div>
													)}
												</div>
											);
										})}
									</div>
								)}
					</div>


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
