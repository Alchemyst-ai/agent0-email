'use client';

import { Mail, Send, Bot } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SidebarProps {
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
	const tabs = [
		{ id: 'inbox', label: 'Inbox', icon: Mail },
		{ id: 'send', label: 'Send Email', icon: Send },
	];

	const [autoReplyEnabled, setAutoReplyEnabled] = useState<boolean>(false);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/api/auto-reply/toggle');
				const data = await res.json();
				setAutoReplyEnabled(!!data.enabled);
			} catch {}
		})();
	}, []);

	return (
		<div className="flex w-full bg-white items-center">
			{tabs.map((tab) => {
				const Icon = tab.icon;
				return (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${
							activeTab === tab.id
								? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 shadow-sm'
								: 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
						}`}
					>
						<Icon className={`w-5 h-5 ${
							activeTab === tab.id ? 'text-blue-600' : 'text-slate-500'
						}`}	/>
						<span className="font-medium">{tab.label}</span>
					</button>
				);
			})}
			<div className="ml-auto flex items-center gap-2 pr-3">
				<label className="flex items-center gap-2 cursor-pointer text-slate-700">
					<input
						type="checkbox"
						checked={autoReplyEnabled}
						onChange={(e) => {
							setAutoReplyEnabled(e.target.checked);
							fetch('/api/auto-reply/toggle', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ enabled: e.target.checked }),
							});
						}}
						className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
					/>
					<span className="text-sm font-medium">Auto-Reply</span>
				</label>
			</div>
		</div>
	);
}
