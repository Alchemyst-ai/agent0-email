"use client";

import { Bot } from "lucide-react";

interface AiRepliesTabProps {
	replyText: string;
	autoReply: boolean;
	onReplyTextChange: (value: string) => void;
	onAutoReplyChange: (value: boolean) => void;
}

export default function AiRepliesTab({
	replyText,
	autoReply,
	onReplyTextChange,
	onAutoReplyChange,
}: AiRepliesTabProps) {
	return (
		<div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
			<h2 className="text-2xl font-semibold text-white mb-4"> <Bot className="w-15 h-15 p-2"/> AI Reply Settings</h2>
			
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-200 mb-2">Custom Reply</label>
					<textarea
						className="w-full border border-gray-600 rounded-lg p-3 bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						rows={3}
						placeholder="Leave empty for AI-generated reply"
						value={replyText}
						onChange={(e) => onReplyTextChange(e.target.value)}
						disabled={autoReply}
					/>
				</div>
				<div className="flex items-center space-x-3">
					<input
						type="checkbox"
						id="autoReply"
						checked={autoReply}
						onChange={(e) => onAutoReplyChange(e.target.checked)}
						className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
					/>
					<label htmlFor="autoReply" className="text-sm text-gray-200">
						Use AI to generate reply automatically
					</label>
				</div>
			</div>
		</div>
	);
}
