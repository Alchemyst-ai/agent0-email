"use client";

interface MessageDisplayProps {
	error: string;
	success: string;
}

export default function MessageDisplay({ error, success }: MessageDisplayProps) {
	return (
		<div className="fixed top-4 right-4 z-50 space-y-2">
			{error && (
				<div className="min-w-[240px] max-w-sm shadow-md mb-2 px-4 py-3 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-start gap-2">
					<span>⚠️</span>
					<div className="text-sm leading-5 break-words">{error}</div>
				</div>
			)}
			{success && (
				<div className="min-w-[240px] max-w-sm shadow-md px-4 py-3 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-start gap-2">
					<span>✅</span>
					<div className="text-sm leading-5 break-words">{success}</div>
				</div>
			)}
		</div>
	);
}
