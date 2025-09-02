'use client';

import { useState, useEffect } from 'react';
import { EmailMessage } from '@/lib/email-engine';
import { ArrowLeft, Send, Loader2, MessageSquare, List } from 'lucide-react';

interface ThreadViewerProps {
	email: EmailMessage;
	messages: EmailMessage[];
	onBack: () => void;
	accountEmail: string;
}

interface MessageWithContent extends EmailMessage {
	html?: string;
	textContent?: string;
	contentLoaded?: boolean;
	contentLoading?: boolean;
}

export default function ThreadViewer({ email, messages, onBack, accountEmail }: ThreadViewerProps) {
	const [messagesWithContent, setMessagesWithContent] = useState<MessageWithContent[]>([]);
	const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
	const [replyText, setReplyText] = useState('');
	const [sendingReply, setSendingReply] = useState(false);
	const [viewMode, setViewMode] = useState<'chat' | 'thread'>('chat');
	const [generatingAutoReply, setGeneratingAutoReply] = useState(false);
	const [autoReplyContent, setAutoReplyContent] = useState<string>('');

	// Generate AI auto-reply for the entire thread
	const generateAutoReply = async (forceAutoSend: boolean = false) => {
		if (!email.threadId) {
			console.error('No thread ID available for auto-reply');
			alert('No thread ID available for auto-reply');
			return;
		}
		
		console.log('Generating auto-reply for thread:', email.threadId, 'forceAutoSend:', forceAutoSend);
		setGeneratingAutoReply(true);
		try {
			// Call the auto-reply API
			const response = await fetch('/api/auto-reply', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					threadId: email.threadId,
					action: 'generate'
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to generate auto-reply');
			}

			const result = await response.json();
			
			// Always set the reply text in the input field
			setReplyText(result.reply);
			console.log('Generated reply:', result.reply);
			
			// Determine if we should auto-send
			const shouldAutoSend = forceAutoSend;
			
			if (shouldAutoSend) {
				console.log('Auto-send enabled, sending automatically');
				// Store the reply for auto-sending
				setAutoReplyContent(result.reply);
			} else {
				// Manual mode: just show the generated reply
				console.log('Manual mode, showing reply for review');
			}
			
		} catch (error) {
			console.error('Error generating auto-reply:', error);
			alert('Failed to generate auto-reply. Please try again.');
		} finally {
			setGeneratingAutoReply(false);
		}
	};

	useEffect(() => {
		// Initialize messages with content tracking
		const initialMessages = messages.map(msg => ({
			...msg,
			html: undefined,
			textContent: undefined,
			contentLoaded: false,
			contentLoading: false,
		}));
		setMessagesWithContent(initialMessages);
	}, [messages]);

	// Auto-send reply when autoReplyContent is set (manual trigger only)
	useEffect(() => {
		if (autoReplyContent && !generatingAutoReply) {
			console.log('🔄 Auto-sending reply from useEffect');
			console.log('Auto-reply content:', autoReplyContent);
			
			// Set the reply text and send
			setReplyText(autoReplyContent);
			
			// Small delay to ensure state is updated, then send
			setTimeout(() => {
				handleSendReply();
				// Clear the auto-reply content after sending
				setAutoReplyContent('');
			}, 100);
		}
	}, [autoReplyContent, generatingAutoReply]);

	const toggleMessage = async (messageId: string) => {
		const message = messagesWithContent.find(m => m.id === messageId);
		if (!message) return;

		if (expandedMessages.has(messageId)) {
			// Collapse
			setExpandedMessages(prev => {
				const newSet = new Set(prev);
				newSet.delete(messageId);
				return newSet;
			});
		} else {
			// Expand and load content if not already loaded
			setExpandedMessages(prev => new Set(prev).add(messageId));
			
			if (!message.contentLoaded && !message.contentLoading) {
				await loadMessageContent(messageId);
			}
		}
	};

	const loadMessageContent = async (messageId: string) => {
		const message = messagesWithContent.find(m => m.id === messageId);
		if (!message || !message.text?.id) return;

		// Mark as loading
		setMessagesWithContent(prev => 
			prev.map(m => 
				m.id === messageId 
					? { ...m, contentLoading: true }
					: m
			)
		);

		try {
			const response = await fetch(`/api/emails/content/${message.text.id}`);
			if (!response.ok) {
				throw new Error('Failed to fetch message content');
			}
			const data = await response.json();

			setMessagesWithContent(prev => 
				prev.map(m => 
					m.id === messageId 
						? { 
							...m, 
							html: data.html,
							textContent: data.textContent,
							contentLoaded: true,
							contentLoading: false
						}
						: m
				)
			);
		} catch (error) {
			console.error('Error loading message content:', error);
			setMessagesWithContent(prev => 
				prev.map(m => 
					m.id === messageId 
						? { ...m, contentLoading: false }
						: m
				)
			);
		}
	};

	const handleSendReply = async () => {
		if (!replyText.trim() || sendingReply) return;

		console.log('🚀 Starting to send reply:', { replyText, emailFrom: email.from.address, subject: email.subject });
		setSendingReply(true);
		try {
			// Always send as a reply to the thread using EmailEngine's reply format
			const requestBody = {
				emails: email.from.address,
				subject: `Re: ${email.subject}`,
				brief: replyText,
				format: 'friendly',
				action: 'send',
				reference: {
					message: email.id, // Use the EmailEngine message ID
					action: "reply",
					inline: true
				}
			};

			console.log('📤 Sending request to /api/send:', requestBody);

			const response = await fetch('/api/send', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			console.log('📥 Response status:', response.status);
			const result = await response.json();
			console.log('📥 Response result:', result);

			if (result.ok) {
				console.log('✅ Reply sent successfully!');
				setReplyText('');
			} else {
				console.error('❌ Failed to send reply:', result.error);
				alert(`Failed to send reply: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ Error sending reply:', error);
			alert(`Error sending reply: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setSendingReply(false);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const isOwnMessage = (message: EmailMessage) => {
		console.log('🔍 Checking message ownership:', {
			messageFrom: message.from.address,
			accountEmail: accountEmail,
			isMatch: message.from.address === accountEmail
		});
		return message.from.address === accountEmail;
	};

	const renderChatView = () => (
		<div className="flex-1 overflow-y-auto p-4 space-y-4">
			{messagesWithContent.map((message) => (
				<div
					key={message.id}
					className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
				>
					<div
						className={`max-w-[70%] rounded-lg p-3 ${
							isOwnMessage(message)
								? 'bg-blue-500 text-white'
								: 'bg-gray-100 text-gray-900'
						}`}
					>
						{/* Message Header */}
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium">
								{message.from.name}
							</span>
							<span className={`text-xs ${
								isOwnMessage(message) ? 'text-blue-100' : 'text-gray-500'
							}`}>
								{formatDate(message.date)}
							</span>
						</div>

						{/* Message Content */}
						<div className="text-sm">
							{expandedMessages.has(message.id) ? (
								<div>
									{message.contentLoading ? (
										<div className="flex items-center justify-center py-4">
											<Loader2 className="w-4 h-4 animate-spin" />
											<span className="ml-2">Loading...</span>
										</div>
									) : message.html ? (
										<div
  										    className="prose prose-sm max-w-none p-4"
  											style={ {
											color: "black"
													}}
  											dangerouslySetInnerHTML={{ __html: message.html }}
											/>

									) : message.textContent ? (
										<div className="whitespace-pre-wrap">{message.textContent}</div>
									) : (
										<div className="text-gray-500">No content available</div>
									)}
								</div>
							) : (
								<div className="cursor-pointer" onClick={() => toggleMessage(message.id)}>
									<div className="text-gray-500 italic">Click to expand message...</div>
								</div>
							)}
						</div>
					</div>
				</div>
			))}
		</div>
	);

	const renderThreadView = () => (
		<div className="flex-1 overflow-y-auto p-4 space-y-2">
			{messagesWithContent.map((message) => (
				<div
					key={message.id}
					className="border border-gray-200 rounded-lg overflow-hidden"
				>
					{/* Message Header */}
					<div 
						className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
						onClick={() => toggleMessage(message.id)}
					>
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-medium text-gray-900">
										{message.from.name}
									</span>
									<span className="text-gray-500 text-sm">
										{formatDate(message.date)}
									</span>
								</div>
								<div className="text-gray-700 text-sm">
									{message.subject}
								</div>
							</div>
							<div className="text-gray-400">
								{expandedMessages.has(message.id) ? '▼' : '▶'}
							</div>
						</div>
					</div>

					{/* Message Content */}
					{expandedMessages.has(message.id) && (
						<div className="p-4 bg-white border-t border-gray-200">
							{message.contentLoading ? (
								<div className="flex items-center justify-center py-4">
									<Loader2 className="w-4 h-4 animate-spin" />
									<span className="ml-2">Loading...</span>
								</div>
							) : message.html ? (
								<div 
									className="prose prose-sm max-w-none"
									style={ {
										color: "black"
									}}
									dangerouslySetInnerHTML={{ __html: message.html }}
								/>
							) : message.textContent ? (
								<div className="whitespace-pre-wrap text-sm">{message.textContent}</div>
							) : (
								<div className="text-gray-500 text-sm">No content available</div>
							)}
						</div>
					)}
				</div>
			))}
		</div>
	);

	return (
		<div className="h-full flex flex-col bg-white">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
				<div className="flex items-center gap-3">
					<button
						onClick={onBack}
						className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<div>
						<h2 className="font-semibold text-slate-800">{email.subject}</h2>
						<p className="text-sm text-slate-600">
							{email.from.name} • {formatDate(email.date)}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
					<button
						onClick={() => setViewMode('chat')}
						className={`p-2 rounded-md transition-colors ${
							viewMode === 'chat' 
								? 'bg-blue-500 text-white shadow-sm' 
								: 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
						}`}
						title="Chat View"
					>
						<MessageSquare className="w-4 h-4" />
					</button>
					<button
						onClick={() => setViewMode('thread')}
						className={`p-2 rounded-md transition-colors ${
							viewMode === 'thread' 
								? 'bg-blue-500 text-white shadow-sm' 
								: 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
						}`}
						title="Thread View"
					>
						<List className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Messages */}
			{viewMode === 'chat' ? renderChatView() : renderThreadView()}

			{/* Reply Input */}
			<div className="p-4 border-t border-slate-200 bg-slate-50">
			<div className="flex items-center justify-between mb-3">
				{/* Generate Reply Button */}
				<div className="flex items-center gap-2 mb-3">
					<button
						onClick={() => generateAutoReply(false)} // Manual mode
						disabled={generatingAutoReply}
						className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
						title="Generate AI reply for this thread"
					>
						{generatingAutoReply ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<MessageSquare className="w-4 h-4" />
						)}
						<span className="ml-1">Generate Reply</span>
					</button>
				</div>
			</div>
				
				<div className="flex gap-2">
					<input
						type="text"
						value={replyText}
						onChange={(e) => setReplyText(e.target.value)}
						placeholder="Generated reply will appear here. Edit if needed, then click Send."
						className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
						onKeyPress={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								handleSendReply();
							}
						}}
					/>
					<button 
						onClick={handleSendReply}
						disabled={sendingReply || !replyText.trim()}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
					>
						{sendingReply ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
