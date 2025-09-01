import { z } from "zod";

export const sendEmailSchema = z.object({
	emails: z.union([z.string(), z.array(z.string())]),
	subject: z.string().min(1),
	brief: z.string().min(1),
	format: z.enum(["formal", "casual", "concise", "friendly"]).default("friendly"),
	action: z.enum(["send", "preview"]).default("send"),
});

export const replyActionSchema = z.object({
	action: z.literal("reply"),
	messageId: z.string(),
	replyText: z.string(),
	autoReply: z.boolean().default(false),
});

export const threadRequestSchema = z.object({
	threadId: z.string(),
});

export const placeholderSchema = z.object({
	message: z.string(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type ReplyActionInput = z.infer<typeof replyActionSchema>;
export type ThreadRequestInput = z.infer<typeof threadRequestSchema>;