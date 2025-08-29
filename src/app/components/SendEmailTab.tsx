"use client";

import { useState } from "react";
import { Bot, Send, X, Minus, Maximize2, Minimize2 } from "lucide-react";

interface SendEmailTabProps {
    recipients: string;
    subject: string;
    brief: string;
    loading: boolean;
    onRecipientsChange: (value: string) => void;
    onSubjectChange: (value: string) => void;
    onBriefChange: (value: string) => void;
    onSendEmail: () => void;
}

interface GeneratedEmail {
    to: string;
    subject: string;
    body: string;
}

export default function SendEmailTab({
    recipients,
    subject,
    brief,
    loading,
    onRecipientsChange,
    onSubjectChange,
    onBriefChange,
    onSendEmail,
}: SendEmailTabProps) {
    const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    const handleGenerateEmail = async () => {
        if (!recipients || !subject || !brief) {
            return;
        }

        setGenerating(true);
        try {
			console.log(recipients , brief, subject);
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

			const emailArray = recipients
				.split(/[,\n]/)  // Split by comma or newline
				.map(s => s.trim())
				.filter(Boolean)
				.filter(email => {
					if (!emailRegex.test(email)) {
						console.warn(`Skipping invalid email: "${email}"`);
						return false;
					}
					return true;
				});
    
			if (emailArray.length === 0) {
				console.error("No valid email addresses found");
				return;
			}
			// recipients.split(/[,\\n]/).map(s => s.trim()).filter(Boolean)
            const res = await fetch("/api/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emails: emailArray,
                    subject,
                    brief,
                    format: "friendly",
                    action: "preview", 
					useEmailEngine: false 
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.preview) {
                    console.log("Generated Preview:", data.preview);
                    setGeneratedEmail({
                        to: recipients,
                        subject: data.preview.subject,
                        body: data.preview.html || data.preview.text,
                    });
                    setShowPreview(true);
                }
            }
        } catch (error) {
            console.error("Failed to generate email:", error);
        } finally {
            setGenerating(false);
        }
    };

    const handleSendFromPreview = (emailData: { to: string; subject: string; body: string }) => {
        onRecipientsChange(emailData.to);
        onSubjectChange(emailData.subject);
        onBriefChange(emailData.body);
        setShowPreview(false);
        onSendEmail();
    };

    const handleCopyToForm = (emailData: { to: string; subject: string; body: string }) => {
        onRecipientsChange(emailData.to);
        onSubjectChange(emailData.subject);
        onBriefChange(emailData.body);
        setShowPreview(false);
        setGeneratedEmail(null);
    };

    const handleClosePreview = () => {
        setShowPreview(false);
        setGeneratedEmail(null);
    };

    return (
        <>
            <div className={`fixed ${isMaximized ? 'inset-4' : 'bottom-0 right-4'} bg-gray-900 z-40 transition-all duration-300 ${isMinimized ? 'h-12' : isMaximized ? 'h-full' : 'h-[600px]'} ${isMaximized ? 'w-full' : 'w-[500px]'} max-w-full`}>
                <div className="bg-gray-950/80 border border-gray-600 rounded-t-lg shadow-2xl flex flex-col h-full">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-4 py-3  border-b border-gray-600 rounded-t-lg">
                        <div className="flex items-center gap-3">
                            <Send className="w-5 h-5 text-gray-300" />
                            <span className="font-medium text-gray-100">New Mail</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                            >
                                {isMinimized ? <Maximize2 className="w-4 h-4 text-gray-300" /> : <Minus className="w-4 h-4 text-gray-300" />}
                            </button>
                            {/* <button 
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                            >
                                {isMaximized ? <Minimize2 className="w-4 h-4 text-gray-300" /> : <Maximize2 className="w-4 h-4 text-gray-300" />}
                            </button> */}
                            <button className="p-1.5 rounded-full transition-colors">
                                <X className="w-4 h-4 text-gray-900" />
                            </button>
                        </div>
                    </div>

                    {/* Content - Hidden when minimized */}
                    {!isMinimized && (
                        <div className="flex-1 flex flex-col">
                            {/* Email Form Fields */}
                            <div className="border-b border-gray-600">
                                {/* To Field */}
                                <div className="flex items-center px-4 py-3 border-b border-gray-600">
                                    <label className="w-15 text-sm text-gray-300 font-medium">To :</label>
                                    <input
                                        className="flex-1 outline-none overflow-wrap text-gray-100 placeholder-gray-400 text-sm bg-transparent"
                                        placeholder="Recipients"
                                        value={recipients}
                                        onChange={(e) => onRecipientsChange(e.target.value)}
                                    />
                                </div>

                                {/* Subject Field */}
                                <div className="flex items-center px-4 py-3">
                                    <label className="w-15 text-sm text-gray-300 font-medium">Subject :</label>
                                    <input
                                        className="flex-1 outline-none overflow-wrap text-gray-100 placeholder-gray-400 text-sm bg-transparent"
                                        placeholder="Subject"
                                        value={subject}
                                        onChange={(e) => onSubjectChange(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="flex-1 p-4 bg-gray-900">
                                <textarea
                                    className="w-full h-full resize-none outline-none text-gray-100 placeholder-gray-400 text-sm leading-relaxed bg-transparent"
                                    placeholder="Compose your message..."
                                    value={brief}
                                    onChange={(e) => onBriefChange(e.target.value)}
                                />
                            </div>

                            {/* Bottom Toolbar */}
                            <div className="flex items-center justify-between p-4 bg-gray-950/80 border-t border-gray-600">
                                <div className="flex items-center gap-2">
                                    
                                    <button
                                        onClick={onSendEmail}
                                        disabled={loading || !recipients || !subject || !brief}
                                        className="px-6 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-full transition-colors flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        {loading ? "Sending..." : "Send"}
                                    </button>

                                    <button
                                        onClick={handleGenerateEmail}
                                        disabled={generating || !recipients || !subject || !brief}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 text-gray-100 text-sm font-medium rounded-full transition-colors flex items-center gap-2"
                                    >
                                        {generating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Bot className="w-4 h-4" />
                                                AI Generate
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Attachment and formatting tools
                                <div className="flex items-center gap-2">
                                    <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                                        <Paperclip className="w-4 h-4 text-gray-300" />
                                    </button>
                                    <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                                        <Image className="w-4 h-4 text-gray-300" />
                                    </button>
                                    <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                                        <MoreHorizontal className="w-4 h-4 text-gray-300" />
                                    </button>
                                </div> */}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal - Dark Theme */}
            {showPreview && generatedEmail && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-4xl max-h-[90vh] bg-gray-950 rounded-lg shadow-2xl overflow-hidden border border-gray-600">
                        {/* Preview Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-600">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-sky-900/50 rounded-full flex items-center justify-center">
                                    <Send className="w-4 h-4 text-sky-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-100">Email Preview</div>
                                    <div className="text-xs text-gray-400">Generated by AI</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md transition-colors"
                                    onClick={() => handleSendFromPreview(generatedEmail)}
                                >
                                    Send Now
                                </button>
                                <button
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm font-medium rounded-md transition-colors"
                                    onClick={() => handleCopyToForm(generatedEmail)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="p-2 hover:bg-gray-900 rounded-md transition-colors"
                                    onClick={handleClosePreview}
                                >
                                    <X className="w-4 h-4 text-gray-300" />
                                </button>
                            </div>
                        </div>

                        {/* Email Details */}
                        <div className="p-6 border-b border-gray-600">
                            <div className="text-xs text-gray-400 mb-1">To:</div>
                            <div className="text-sm text-gray-200 mb-3">{generatedEmail.to}</div>
                            <div className="text-md font-semibold text-gray-100">{generatedEmail.subject}</div>
                        </div>

                        {/* Email Body */}
                        <div className="p-6 overflow-auto max-h-[500px] bg-gray-950">
                            <div 
                                className="prose prose-sm prose-invert max-w-none text-gray-300 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: generatedEmail.body }} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
