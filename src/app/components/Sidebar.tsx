'use client';

import { Mail, Send, History, LogOut, User, Settings, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';


interface SidebarProps {
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
	const { user, logout } = useAuth();

	return (
		<div className="flex flex-col w-full">
			<div className="p-4 border-t space-y-4">
				<Button
					variant="ghost"
					onClick={() => {
						setActiveTab('auto-reply');
					}}
					className="flex items-center gap-2 justify-start"
					title="Configure Auto-Reply"
				>
					<SlidersHorizontal className="w-4 h-4" />
					<span className="text-sm font-medium">Configure Auto-Reply</span>
				</Button>
				
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
