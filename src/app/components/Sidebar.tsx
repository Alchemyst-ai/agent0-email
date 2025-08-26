"use client";
import { Inbox, Send, Bot } from "lucide-react";
type TabType = "inbox" | "send" | "ai-replies";

interface SidebarProps {
	activeTab: TabType;
	onTabChange: (tab: TabType) => void;
}

const tabs = [
	{ id: "inbox" as TabType, label: "Inbox", icon: Inbox },
	{ id: "send" as TabType, label: "Send Email", icon: Send },
	// { id: "ai-replies" as TabType, label: "AI Replies", icon: Bot },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
	return (
		<div className="w-20 bg-gray-900 border-r border-gray-700">
			<div className="p-4 mt-10">
				<nav className="space-y-2">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => onTabChange(tab.id)}
							className={`w-full flex items-center space-x-3 px-2 py-3 rounded-lg text-left transition-colors ${
								activeTab === tab.id
									? "bg-sky-500 text-white"
									: "text-gray-300 hover:bg-gray-700 hover:text-white"
							}`}
						>
							<span className="text-lg pl-1"><tab.icon/></span>
							{/* <span className="font-medium">{tab.label}</span> */}
						</button>
					))}
				</nav>
			</div>
		</div>
	);
}
