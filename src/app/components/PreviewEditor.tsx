'use client';

import { useState } from 'react';
import { ArrowLeft, Send, Eye, Code } from 'lucide-react';

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
	const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

	const handleSend = async () => {
		setSending(true);
		try {
			// Call the send API with the edited content
			const result = await onSendEmail({
				emails: recipients,
				subject: editedSubject,
				brief: editedHtml,
				format: 'formal',
				action: 'send'
			});
			
			if (result.ok) {
				onSend(); // Close the editor and show success
			} else {
				console.error('Failed to send email:', result.error);
				// You could add error handling here
			}
		} catch (error) {
			console.error('Error sending email:', error);
			// You could add error handling here
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
					<div className="flex items-center gap-2">
						<button
							onClick={onBack}
							className="p-2 hover:bg-green-500 rounded-lg transition-colors text-white hover:text-white"
							title="Back to compose"
						>
							<ArrowLeft className="w-4 h-4" />
						</button>
					</div>
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
							<button
								onClick={() => setViewMode('edit')}
								className={`px-3 py-1 text-xs rounded-md transition-colors ${
									viewMode === 'edit' 
										? 'bg-green-100 text-green-700 border border-green-300' 
										: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
								}`}
							>
								<Code className="w-3 h-3 inline mr-1" />
								Edit HTML
							</button>
							<button
								onClick={() => setViewMode('preview')}
								className={`px-3 py-1 text-xs rounded-md transition-colors ${
									viewMode === 'preview' 
										? 'bg-green-100 text-green-700 border border-green-300' 
										: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
								}`}
							>
								<Eye className="w-3 h-3 inline mr-1" />
								Preview
							</button>
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
								className="prose prose-sm max-w-none"
								style={{
									color: "black"
								}}
								dangerouslySetInnerHTML={{ __html: editedHtml }}
							/>
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2 pt-4 border-t border-slate-200">
					<button
						onClick={onBack}
						className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Compose
					</button>
				</div>
			</div>
		</div>
	);
}
