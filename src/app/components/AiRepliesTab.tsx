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
		<div className="bg-gray-900/80 rounded-lg border border-gray-800 p-6">
			<h2 className="flex gap-2 text-2xl font-semibold text-white items-center mb-3"> <Bot className="w-12 h-12 p-1"/> AI Reply Settings</h2>
			
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-200 mb-2 pl-1">Custom Reply</label>
					<textarea
						className="w-full border border-gray-700 rounded-lg p-3 bg-gray-800/80 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						rows={3}
						placeholder="Leave empty for AI-generated reply"
						value={replyText}
						onChange={(e) => onReplyTextChange(e.target.value)}
						disabled={autoReply}
					/>
				</div>
				<div className="flex items-center space-x-3 pl-2">
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
