'use client';

import { useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SendEmailTabProps {
	onSendEmail: (data: {
		emails: string | string[];
		subject: string;
		brief: string;
		format: 'formal' | 'casual' | 'concise' | 'friendly';
		action: 'send' | 'preview';
	}) => Promise<{ ok: boolean; error?: string; preview?: { subject: string; html: string; text: string } }>;
}

export default function SendEmailTab({ onSendEmail }: SendEmailTabProps) {
	const [recipients, setRecipients] = useState('');
	const [subject, setSubject] = useState('');
	const [brief, setBrief] = useState('');
	const [format, setFormat] = useState<'formal' | 'casual' | 'concise' | 'friendly'>('friendly');
	const [loading, setLoading] = useState(false);
	const [preview, setPreview] = useState<{ subject: string; html: string; text: string } | null>(null);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const handlePreview = async () => {
		if (!recipients || !subject || !brief) {
			setError('Please fill in all fields');
			return;
		}

		setLoading(true);
		setError('');
		setSuccess('');

		try {
			const result = await onSendEmail({
				emails: recipients.split(/[\,\n]/).map(s => s.trim()).filter(Boolean),
				subject,
				brief,
				format,
				action: 'preview'
			});

			// Persist recipients for PreviewEditor to use
			sessionStorage.setItem('composeRecipients', JSON.stringify(
				recipients.split(/[\,\n]/).map(s => s.trim()).filter(Boolean)
			));

			if (result.ok && result.preview) {
				setPreview(result.preview);
				setSuccess('Preview generated successfully! Edit and send on the right.');
			} else {
				setError(result.error || 'Failed to generate preview');
			}
		} catch (err) {
			setError((err as Error).message || 'Failed to generate preview');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="p-4 border-b border-slate-200 bg-gradient-to-r">
				<h2 className="text-lg font-semibold">Compose Email</h2>
			</div>

			{/* Form */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
				{/* Recipients */}
				<div>
					<label className="block text-sm font-medium text-slate-700 mb-2">
						To (comma or newline separated)
					</label>
					<textarea
						value={recipients}
						onChange={(e) => setRecipients(e.target.value)}
						placeholder="recipient@example.com, another@example.com"
						className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-slate-900 placeholder-slate-500"
						rows={3}
					/>
				</div>

				{/* Subject */}
				<div>
					<label className="block text-sm font-medium text-slate-700 mb-2">
						Subject
					</label>
					<input
						type="text"
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						placeholder="Enter subject..."
						className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-500"
					/>
				</div>

				{/* Brief */}
				<div>
					<label className="block text-sm font-medium text-slate-700 mb-2">
						Brief Description
					</label>
					<textarea
						value={brief}
						onChange={(e) => setBrief(e.target.value)}
						placeholder="Describe what you want to say..."
						className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-slate-900 placeholder-slate-500"
						rows={4}
					/>
				</div>

				{/* Format */}
				<div>
					<label className="block text-sm font-medium text-slate-700 mb-2">
						Tone
					</label>
					<select
						value={format}
						onChange={(e) => setFormat(e.target.value as 'formal' | 'casual' | 'concise' | 'friendly')}
						className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
					>
						<option value="friendly">Friendly</option>
						<option value="formal">Formal</option>
						<option value="casual">Casual</option>
						<option value="concise">Concise</option>
					</select>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2 pt-4">
					<Button
						onClick={handlePreview}
						disabled={loading}
						className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-sm"
					>
						{loading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Eye className="w-4 h-4" />
						)}
						Generate
					</Button>
				</div>

				{/* Messages */}
				{error && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-red-600 text-sm">{error}</p>
					</div>
				)}
				{success && (
					<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
						<p className="text-green-600 text-sm">{success}</p>
					</div>
				)}

			</div>
		</div>
	);
}
