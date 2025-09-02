import { getServerEnv } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from "@/lib/ai";
import { searchMessagesByThreadId, getMessageContentOnDemand, sendEmailWithEmailEngine } from "@/lib/email-engine";
import { getAutoReplyEnabled } from "@/lib/settings";

const handler = async (req: NextRequest) => {
  try {
    const reqBody = await req.json();
    console.log('THE EVENTS', reqBody.event);

    if (reqBody.event === 'messageFailed') {
      const emailAccount = reqBody.data.account;
      console.log('❌ Email failed for account:', emailAccount);
    }

    if (reqBody.event === 'messageNew') {
      const env = getServerEnv();
      const toAddress = reqBody?.data?.to?.[0]?.address;
      const fromAddress = reqBody?.data?.from?.address;
      const threadId = reqBody?.data?.threadId;
      
      const incomingMessageId = reqBody?.data?.id || reqBody?.data?.messageId;

      if (toAddress && toAddress === env.EMAIL_ENGINE_ACCOUNT) {
        console.log('Email new for account:', toAddress);
        console.log('TEH BODY REPLY', reqBody.data);

        if (!getAutoReplyEnabled()) {
          console.log('Global auto-reply is disabled. Skipping.');
          return NextResponse.json({ ok: true, skipped: true, reason: 'auto-reply disabled' });
        }

        // Prevent replying to self or system messages
        if (fromAddress && fromAddress.toLowerCase() === env.EMAIL_ENGINE_ACCOUNT.toLowerCase()) {
          console.log('Skipping auto-reply to our own message.');
        } else if (threadId) {
          try {
            // 1) Fetch thread messages metadata
            const searchResponse = await searchMessagesByThreadId(threadId);
            const threadMessages = searchResponse?.messages || [];

            // 2) Load latest message content
            const latest = threadMessages.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            const contentId = latest?.text?.id || latest?.id;
            let latestContentHtml = '';
            if (contentId) {
              const content = await getMessageContentOnDemand(contentId);
              latestContentHtml = content.html || content.textContent || '';
            }

            // 3) Build conversation context summary
            const context = threadMessages
              .slice(-5)
              .map((m: any) => `${m.from?.name || m.from?.address || 'Unknown'} (${m.date}): ${m.subject}`)
              .join('\n\n');
            const conversationContext = [latestContentHtml, context].filter(Boolean).join('\n\n');

            // 4) Generate reply via OpenAI (prompt aligned with auto-reply route)
            const openai = createOpenAI();
            const prompt = `You are an email assistant. Based on the following email conversation thread, generate a natural and contextual reply. \n\nIMPORTANT: \n- This is a REPLY to the most recent message, not a new email\n- Do NOT include a subject line\n- Do NOT include "From:" or "To:" headers\n- Generate ONLY the reply content in natural language\n- Keep it professional but conversational\n- Reference the conversation context appropriately\n- Keep it concise (2-4 sentences)\n\nCONTEXT: You are replying as ${env.EMAIL_ENGINE_ACCOUNT} - this is your email address and identity or you can find your identity from the conversation context for example you can find name using ${env.EMAIL_ENGINE_ACCOUNT} in the conversation context another example \n\n"from": {\n                "name": "Srivathsav Kyatham",\n                "address": "srivathsavkyatham@gmail.com"\n            },\n            "replyTo": [\n                {\n                    "name": "Srivathsav Kyatham",\n                    "address": "srivathsavkyatham@gmail.com"\n                }\n            ],\n            "to": [\n                {\n                    "name": "me.maverick369",\n                    "address": "me.maverick369@gmail.com"\n                }\n            ], here Srivathsav Kyatham is name and srivathsavkyatham@gmail.com is your email address and me.maverick369 is name and me.maverick369@gmail.com is your email address.\n\nEmail Thread:\n${conversationContext}\n\nGenerate a natural reply as ${env.EMAIL_ENGINE_ACCOUNT}:`;
            const completion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: `You write natural email replies as ${env.EMAIL_ENGINE_ACCOUNT}.` },
                { role: 'user', content: prompt },
              ],
              temperature: 0.6,
              max_tokens: 220,
            });
            const replyText = completion.choices?.[0]?.message?.content?.trim() || '';
            if (!replyText) {
              console.log('No reply generated, skipping send.');
            } else {
              // 5) Send reply via EmailEngine with reference to original
              const results = await sendEmailWithEmailEngine(
                {
                  to: fromAddress,
                  subject: `Re: ${reqBody?.data?.subject || ''}`.trim(),
                  text: replyText,
                  html: `<p>${replyText.replace(/\n/g, '<br/>')}</p>`,
                  reference: {
                    message: incomingMessageId,
                    action: 'reply',
                  },
                },
                env.EMAIL_ENGINE_ACCOUNT
              );
              console.log('Auto-reply send results:', results);
            }
          } catch (err) {
            console.error('Auto-reply flow failed:', err);
          }
        }
      } else {
        console.log('Add your account to the EmailEngine :', toAddress);
        console.log('The body is:', reqBody.data);
        console.log("This is not your account");
      }
    }

    if (reqBody.event === 'trackOpen') {
      console.log('👁️ Email opened:', reqBody.data.messageId);
    }

    if (reqBody.event === 'messageSent') {
      console.log('✅ Email sent successfully:', reqBody.data.messageId);
    }
  } catch (error) {
    console.log('Error: ', error);
  }

  return NextResponse.json({ ok: true });
};

export { handler as POST };
