'use client';

import { Mail, Send, History, Loader2, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';


interface SidebarProps {
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
	const { user, logout } = useAuth();
	const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
	const [loadingToggle, setLoadingToggle] = useState(false);

	useEffect(() => {
		const fetchToggleState = async () => {
			try {
				const response = await fetch('/api/auto-reply/toggle');
				if (response.ok) {
					const data = await response.json();
					setAutoReplyEnabled(data.enabled);
				} else {
					console.error('Failed to fetch auto-reply toggle state');
				}
			} catch (error) {
				console.error('Error fetching auto-reply toggle state:', error);
			}
		};
		fetchToggleState();
	}, []);

	const handleToggleChange = async (enabled: boolean) => {
		setLoadingToggle(true);
		try {
			const response = await fetch('/api/auto-reply/toggle', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled }),
			});
			if (response.ok) {
				setAutoReplyEnabled(enabled);
			} else {
				console.error('Failed to update auto-reply toggle state');
			}
		} catch (error) {
			console.error('Error updating auto-reply toggle state:', error);
		} finally {
			setLoadingToggle(false);
		}
	};


	return (
		<div className="flex flex-col w-full">
			<div className="p-4 border-t space-y-4">
				<label className="flex items-center gap-2 cursor-pointer ">
					<input
						type="checkbox"
						checked={autoReplyEnabled}
						onChange={(e) => handleToggleChange(e.target.checked)}
						disabled={loadingToggle}
						className="w-4 h-4  rounded focus:ring-blue-500 focus:ring-2"
					/>
					<span className="text-sm font-medium">Global Auto-Reply</span>
					{loadingToggle && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
				</label>
				
				{/* User Menu */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<User className="w-4 h-4" />
						<span className="text-sm font-medium">{user?.name}</span>
					</div>
					<Button
						variant="ghost"
						onClick={logout}
						className="flex items-center gap-1  hover:text-slate-800 transition-colors"
						title="Logout"
					>
						<LogOut className="w-4 h-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
