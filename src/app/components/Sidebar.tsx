'use client';

import { Mail, Send, Bot } from 'lucide-react';

interface SidebarProps {
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
	const tabs = [
		{ id: 'inbox', label: 'Inbox', icon: Mail },
		{ id: 'send', label: 'Send Email', icon: Send },
	];

	return (
		<div className="flex w-full bg-white">
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
						}`} />
						<span className="font-medium">{tab.label}</span>
					</button>
				);
			})}
		</div>
	);
}
