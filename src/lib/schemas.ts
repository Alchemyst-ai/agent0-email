import { z } from "zod";

export const sendEmailSchema = z.object({
	emails: z.array(z.string().email()).min(1),
	subject: z.string().min(3).max(120),
	brief: z.string().min(10).max(4000),
	format: z.enum(["formal", "casual", "friendly", "concise"]).default("friendly"),
	action: z.enum(["preview", "send"]).default("send"),
	useEmailEngine: z.boolean().default(false),
});

export const replyActionSchema = z.object({
	action: z.enum(["check", "reply"]),
	messageId: z.string().optional(),
	replyText: z.string().optional(),
	autoReply: z.boolean().default(false),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type ReplyActionInput = z.infer<typeof replyActionSchema>;