"use client";

interface MessageDisplayProps {
	error: string;
	success: string;
}

export default function MessageDisplay({ error, success }: MessageDisplayProps) {
	return (
		<>
			{error && (
				<div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 flex items-center">
					<span className="mr-2">⚠️</span>
					{error}
				</div>
			)}
			{success && (
				<div className="mb-4 p-4 bg-green-900/20 border border-green-800 rounded-lg text-green-400 flex items-center">
					<span className="mr-2">✅</span>
					{success}
				</div>
			)}
		</>
	);
}
