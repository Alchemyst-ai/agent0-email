'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Eye, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewEditorProps {
	preview: {
		subject: string;
		html: string;
		text: string;
	};
	onSend: () => void;
	onBack: () => void;
	onSendEmail: (data: {
		emails: string | string[];
		subject: string;
		brief: string;
		format: 'formal' | 'casual' | 'concise' | 'friendly';
		action: 'send';
	}) => Promise<{ ok: boolean; error?: string }>;
	recipients: string[];
}

export default function PreviewEditor({ preview, onSend, onBack, onSendEmail, recipients }: PreviewEditorProps) {
	const [editedSubject, setEditedSubject] = useState(preview.subject);
	const [editedHtml, setEditedHtml] = useState(preview.html);
	const [sending, setSending] = useState(false);
	const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');

	// Uncontrolled contentEditable to avoid caret jump
	const editorRef = useRef<HTMLDivElement | null>(null);
	const liveHtmlRef = useRef<string>(editedHtml);

	useEffect(() => {
		// Sync preview editor contents when switching to preview or when HTML changes externally
		if (viewMode === 'preview' && editorRef.current) {
			// Only update DOM if content differs (prevents caret move)
			if (editorRef.current.innerHTML !== editedHtml) {
				editorRef.current.innerHTML = editedHtml;
			}
			liveHtmlRef.current = editorRef.current.innerHTML;
		}
	}, [viewMode, editedHtml]);

	const handleSend = async () => {
		setSending(true);
		try {
			// Commit any in-progress edits from preview before sending
			if (viewMode === 'preview' && editorRef.current) {
				liveHtmlRef.current = editorRef.current.innerHTML;
				setEditedHtml(liveHtmlRef.current);
			}

			const result = await onSendEmail({
				emails: recipients,
				subject: editedSubject,
				brief: viewMode === 'preview' ? liveHtmlRef.current : editedHtml,
				format: 'formal',
				action: 'send'
			});
			
			if (result.ok) {
				onSend();
			} else {
				console.error('Failed to send email:', result.error);
			}
		} catch (error) {
			console.error('Error sending email:', error);
		} finally {
			setSending(false);
		}
	};

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="p-4 border-b border-slate-200 bg-gradient-to-r from-green-600 to-green-700">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-white">Edit & Send Email</h2>
					
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{/* Subject */}
				<div>
					<label className="block text-sm font-medium text-slate-700 mb-2">
						Subject
					</label>
					<input
						type="text"
						value={editedSubject}
						onChange={(e) => setEditedSubject(e.target.value)}
						className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900"
					/>
				</div>

				{/* HTML Content Editor */}
				<div>
					<div className="flex items-center justify-between mb-2">
						<label className="block text-sm font-medium text-slate-700">
							Email Content
						</label>
						
						<div className="flex gap-2">
						<Button
								onClick={() => setViewMode('preview')}
								className={`px-3 py-1 text-xs rounded-md transition-colors ${
									viewMode === 'preview' 
										? 'bg-green-100 text-green-700 border border-green-300' 
										: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
								}`}
							>
								<Eye className="w-3 h-3 inline mr-1" />
								Preview
							</Button>
							<Button
								onClick={() => setViewMode('edit')}
								className={`px-3 py-1 text-xs rounded-md transition-colors ${
									viewMode === 'edit' 
										? 'bg-green-100 text-green-700 border border-green-300' 
										: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
								}`}
							>
								<Code className="w-3 h-3 inline mr-1" />
								Edit HTML
							</Button>
							
						</div>
					</div>
					
					{viewMode === 'edit' ? (
						<textarea
							value={editedHtml}
							onChange={(e) => setEditedHtml(e.target.value)}
							className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white text-slate-900 font-mono text-sm"
							rows={12}
							placeholder="<div>Your HTML content here...</div>"
						/>
					) : (
						<div className="border border-slate-300 rounded-lg p-4 bg-white min-h-[300px]">
							<div
								ref={editorRef}
								className="prose prose-sm max-w-none outline-none"
								style={{ color: 'black' }}
								contentEditable
								suppressContentEditableWarning
								onInput={() => {
									if (editorRef.current) {
										liveHtmlRef.current = editorRef.current.innerHTML;
									}
								}}
								onBlur={() => setEditedHtml(liveHtmlRef.current)}
							/>
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2 pt-4 border-t border-slate-200">
					<Button
						onClick={onBack}
						className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Compose
					</Button>
					<Button
						onClick={handleSend}
						disabled={sending}
						className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
					>
						{sending ? (
							<Eye className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
						Send Email
					</Button>
				</div>
			</div>
		</div>
	);
}
