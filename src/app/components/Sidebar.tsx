"use client";

type TabType = "inbox" | "send" | "ai-replies";

interface SidebarProps {
	activeTab: TabType;
	onTabChange: (tab: TabType) => void;
}

const tabs = [
	{ id: "inbox" as TabType, label: "Inbox", icon: "📥" },
	{ id: "send" as TabType, label: "Send Email", icon: "📧" },
	{ id: "ai-replies" as TabType, label: "AI Replies", icon: "🤖" },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
	return (
		<div className="w-64 bg-gray-800 border-r border-gray-700">
			<div className="p-6">
				<h1 className="text-2xl font-bold text-white mb-8">Email Agent</h1>
				<nav className="space-y-2">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => onTabChange(tab.id)}
							className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
								activeTab === tab.id
									? "bg-blue-600 text-white"
									: "text-gray-300 hover:bg-gray-700 hover:text-white"
							}`}
						>
							<span className="text-lg">{tab.icon}</span>
							<span className="font-medium">{tab.label}</span>
						</button>
					))}
				</nav>
			</div>
		</div>
	);
}
