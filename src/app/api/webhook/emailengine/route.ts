import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { createOpenAI } from '@/lib/ai';
import { searchMessagesByThreadId, getMessageContentOnDemand, sendEmailWithEmailEngine } from '@/lib/email-engine';
import { getGlobalAutoReplyEnabled } from '@/lib/settings-db';
import { getEmailDatabase } from '@/lib/email-db';
import { EmailCredentialsDatabase } from '@/lib/email-credentials-db';
import { AutoReplyWhitelistDatabase } from '@/lib/auto-reply-whitelist-db';
import { connectToDatabase } from '@/lib/mongodb';

export async function handler(req: NextRequest) {
  try {
    const reqBody = await req.json();
    console.log('Webhook received:', reqBody.event);

    if (reqBody.event === 'messageNew') {
      const env = getServerEnv();
      const toAddress = reqBody?.data?.to?.[0]?.address;
      const fromAddress = reqBody?.data?.from?.address;
      const threadId = reqBody?.data?.threadId;
      
      const incomingMessageId = reqBody?.data?.id || reqBody?.data?.messageId;

      if (toAddress) {
        console.log('Email new for account:', toAddress);
        console.log('TEH BODY REPLY', reqBody.data);

        // Check if this email is for any of our registered accounts
        try {
          await connectToDatabase();
          const credentialsDb = EmailCredentialsDatabase.getInstance();
          
          // Get user ID from the receiving email address
          const userId = await credentialsDb.getUserIdByEmail(toAddress);
          if (!userId) {
            console.log('No user found for email address:', toAddress);
            return NextResponse.json({ ok: true, skipped: true, reason: 'no user found' });
          }

          // Check if this is the user's active email account
          const activeCredentials = await credentialsDb.getActiveCredentials(userId.toString());
          if (!activeCredentials || activeCredentials.emailId !== toAddress) {
            console.log('Email not for active account:', toAddress, 'Active:', activeCredentials?.emailId);
            return NextResponse.json({ ok: true, skipped: true, reason: 'not active account' });
          }

          console.log('Email is for active account, checking auto-reply settings...');

          const globalEnabled = await getGlobalAutoReplyEnabled();
          if (!globalEnabled) {
            console.log('Global auto-reply is disabled. Skipping.');
            return NextResponse.json({ ok: true, skipped: true, reason: 'auto-reply disabled' });
          }

          // Check if sender is in whitelist
          const whitelistDb = AutoReplyWhitelistDatabase.getInstance();
          const isWhitelisted = await whitelistDb.isEmailWhitelisted(userId, fromAddress);
          if (!isWhitelisted) {
            console.log('Sender not in whitelist:', fromAddress);
            return NextResponse.json({ ok: true, skipped: true, reason: 'sender not whitelisted' });
          }

          console.log('Sender is whitelisted, proceeding with auto-reply:', fromAddress);
        } catch (error) {
          console.error('Error processing email:', error);
          return NextResponse.json({ ok: true, skipped: true, reason: 'processing error' });
        }

        // Prevent replying to self or system messages
        if (fromAddress && fromAddress.toLowerCase() === toAddress.toLowerCase()) {
          console.log('Skipping auto-reply to our own message.');
        } else if (threadId) {
          try {
            // 1) Fetch thread messages metadata
            const searchResponse = await searchMessagesByThreadId(threadId, toAddress);
            const threadMessages = searchResponse?.messages || [];

            // 2) Load latest message content
            const latest = threadMessages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            const contentId = latest?.text?.id || latest?.id;
            let latestContentHtml = '';
            if (contentId) {
              const content = await getMessageContentOnDemand(contentId, toAddress);
              latestContentHtml = content.html || content.textContent || '';
            }

            // 3) Build conversation context summary
            const context = threadMessages
              .slice(-5)
              .map((m) => `${m.from?.name || m.from?.address || 'Unknown'} (${m.date}): ${m.subject}`)
              .join('\n\n');
            const conversationContext = [latestContentHtml, context].filter(Boolean).join('\n\n');

            // 4) Generate reply via OpenAI (prompt aligned with auto-reply route)
            const openai = createOpenAI();
            const prompt = `You are an email assistant. Based on the following email conversation thread, generate a natural and contextual reply. \n\nIMPORTANT: \n- This is a REPLY to the most recent message, not a new email\n- Do NOT include a subject line\n- Do NOT include "From:" or "To:" headers\n- Generate ONLY the reply content in natural language\n- Keep it professional but conversational\n- Reference the conversation context appropriately\n- Keep it concise (2-4 sentences)\n\nCONTEXT: You are replying as ${toAddress} - this is your email address and identity or you can find your identity from the conversation context for example you can find name using ${toAddress} in the conversation context another example \n\n"from": {\n                "name": "Srivathsav Kyatham",\n                "address": "srivathsavkyatham@gmail.com"\n            },\n            "replyTo": [\n                {\n                    "name": "Srivathsav Kyatham",\n                    "address": "srivathsavkyatham@gmail.com"\n                }\n            ],\n            "to": [\n                {\n                    "name": "me.maverick369",\n                    "address": "me.maverick369@gmail.com"\n                }\n            ], here Srivathsav Kyatham is name and srivathsavkyatham@gmail.com is your email address and me.maverick369 is name and me.maverick369@gmail.com is your email address.\n\nEmail Thread:\n${conversationContext}\n\nGenerate a natural reply as ${toAddress}:`;
            const completion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: `You write natural email replies as ${toAddress}.` },
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
                toAddress // Use the receiving email address (active account)
              );
              console.log('Auto-reply send results:', results);

              // 6) Store auto-reply in MongoDB
              try {
                const emailDb = await getEmailDatabase();
                
                // Extract message ID from results
                const messageId = results?.[0]?.id || `auto-reply-${Date.now()}`;
                
                await emailDb.createEmail({
                  messageId,
                  threadId,
                  from: toAddress, // Use the receiving email address (active account)
                  to: [fromAddress],
                  subject: `Re: ${reqBody?.data?.subject || ''}`.trim(),
                  content: { 
                    html: `<p>${replyText.replace(/\n/g, '<br/>')}</p>`, 
                    text: replyText 
                  },
                  type: 'auto-reply',
                  source: 'webhook',
                  status: 'sent',
                  metadata: {
                    aiGenerated: true,
                    prompt: prompt,
                    model: 'gpt-4o-mini',
                    webhookEvent: 'messageNew',
                    originalMessageId: incomingMessageId,
                  },
                });
                
                console.log('Auto-reply stored in MongoDB successfully');
              } catch (dbError) {
                console.error('Failed to store auto-reply in MongoDB:', dbError);
                // Don't fail the webhook if DB storage fails
              }
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
      
      // Update email status in MongoDB
      try {
        const emailDb = await getEmailDatabase();
        await emailDb.updateEmailStatus(reqBody.data.messageId, 'opened');
      } catch (dbError) {
        console.error('Failed to update email status in MongoDB:', dbError);
      }
    }

    if (reqBody.event === 'messageSent') {
      console.log('✅ Email sent successfully:', reqBody.data.messageId);
      
      // Update email status in MongoDB
      try {
        const emailDb = await getEmailDatabase();
        await emailDb.updateEmailStatus(reqBody.data.messageId, 'delivered');
      } catch (dbError) {
        console.error('Failed to update email status in MongoDB:', dbError);
      }
    }

    if (reqBody.event === 'messageFailed') {
      console.log('❌ Email failed to send:', reqBody.data.messageId);
      
      // Update email status in MongoDB
      try {
        const emailDb = await getEmailDatabase();
        await emailDb.updateEmailStatus(reqBody.data.messageId, 'failed');
      } catch (dbError) {
        console.error('Failed to update email status in MongoDB:', dbError);
      }
    }
  } catch (error: unknown) {
    console.log('Error: ', error);
  }

  return NextResponse.json({ ok: true });
};

export { handler as POST };
