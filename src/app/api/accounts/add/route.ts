import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { EmailCredentialsDatabase } from '@/lib/email-credentials-db';
import { encrypt } from '@/lib/crypto';
import { getServerEnv } from '@/lib/env';
import { connectToDatabase } from '@/lib/mongodb';

const PROVIDER_TYPES = {
  MICROSOFT: 'microsoft',
};

function getProviderDisplayName(provider: string): string {
  const providerMap: Record<string, string> = {
    gmail: 'Gmail',
    privateEmail: 'privateEmail',
    yahoo: 'Yahoo',
    outlook: 'Outlook',
  };

  return providerMap[provider.toLowerCase()] || provider;
}

async function createEmailEngineIntegrations(
  credential: { emailId: string; providerIMAPHost?: string; providerIMAPPort?: number; providerSMTPHost?: string; providerSMTPPort?: number },
  rawPassword: string,
  provider: string
): Promise<{ success: boolean; redirectUrl?: string; error?: string; accountId?: string; gatewayId?: string }> {
  const env = getServerEnv();
  const emailEngineBaseUrl = env.EMAIL_ENGINE_BASE_URL;
  const emailEngineAccessToken = env.EMAIL_ENGINE_API_KEY;
  const isMicrosoft = provider === PROVIDER_TYPES.MICROSOFT;

  try {
    const accountRequestBody = isMicrosoft
      ? {
          account: credential.emailId,
          name: credential.emailId.split('@')[0],
          email: credential.emailId,
          oauth2: {
            authorize: true,
            redirectUrl: process.env.EMAIL_ENGINE_MICROSOFT_REDIRECT_URL || 'http://localhost:3000/auth/callback',
            provider: process.env.EMAIL_ENGINE_MICROSOFT_PROVIDER_ID || 'microsoft',
          },
        }
      : {
          account: credential.emailId,
          name: credential.emailId.split('@')[0],
          email: credential.emailId,
          imap: {
            auth: {
              user: credential.emailId,
              pass: rawPassword,
            },
            host: credential.providerIMAPHost,
            port: credential.providerIMAPPort,
            secure: true,
          },
          smtp: {
            auth: {
              user: credential.emailId,
              pass: rawPassword,
            },
            host: credential.providerSMTPHost,
            port: credential.providerSMTPPort,
            secure: true,
          },
        };

    const accountResponse = await fetch(
      `${emailEngineBaseUrl}/v1/account?access_token=${emailEngineAccessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountRequestBody),
      }
    );

    if (!accountResponse.ok) {
      const errorData = await accountResponse.json();
      console.error(`Email engine account creation failed: ${JSON.stringify(errorData)}`);
      return { success: false, error: 'Account creation failed' };
    }

    const accountData = await accountResponse.json();

    if (isMicrosoft) {
      if (accountData.redirect) {
        return { success: true, redirectUrl: accountData.redirect };
      }
      return {
        success: false,
        error: 'Missing redirect URL for Microsoft account',
      };
    }

    const gatewayRequestBody = {
      name: getProviderDisplayName(provider),
      gateway: credential.emailId,
      user: credential.emailId,
      pass: rawPassword,
      host: credential.providerSMTPHost || 'smtp.gmail.com',
      port: credential.providerSMTPPort || 587,
    };

    const gatewayResponse = await fetch(
      `${emailEngineBaseUrl}/v1/gateway?access_token=${emailEngineAccessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gatewayRequestBody),
      }
    );

    if (!gatewayResponse.ok) {
      const errorData = await gatewayResponse.json();
      console.error(`Email engine gateway creation failed: ${JSON.stringify(errorData)}`);
      return { success: false, error: 'Gateway creation failed' };
    }

    const gatewayData = await gatewayResponse.json();

    if (accountData.account && gatewayData.gateway) {
      return { 
        success: true, 
        accountId: accountData.account,
        gatewayId: gatewayData.gateway 
      };
    }

    return { success: false, error: 'Incomplete email engine configuration' };
  } catch (error) {
    console.error('Error connecting to email engine:', error);
    return { success: false, error: String(error) };
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get authenticated user
    const user = await AuthService.getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Handle both single credential and array of credentials
    const credentialsArray = Array.isArray(data.credentials)
      ? data.credentials
      : [data.credentials || data];

    const responses: Array<{ email: string; success: boolean; error?: string; credentialsId?: string; redirectUrl?: string }> = [];
    const credentialsDb = EmailCredentialsDatabase.getInstance();

    for (const credential of credentialsArray) {
      const {
        email,
        password,
        meetingLink,
        provider = 'gmail',
        providerIMAPHost = 'imap.gmail.com',
        providerIMAPPort = 993,
        providerSMTPHost = 'smtp.gmail.com',
        providerSMTPPort = 587,
        providerInboxName = 'INBOX',
        providerSentBoxName = '[Gmail]/Sent Mail',
      } = credential;

      // Validate required fields
      if (!email || !password) {
        responses.push({
          email,
          success: false,
          error: 'Email and password are required',
        });
        continue;
      }

      // Check if credentials already exist for this user
      const existingCredentials = await credentialsDb.getCredentialsByEmail(email, user._id.toString());
      if (existingCredentials) {
        responses.push({
          email,
          success: false,
          error: 'Email credentials already exist for this user',
        });
        continue;
      }

      // Encrypt password
      const encryptedPassword = encrypt(password, process.env.PASSWORD_CRYPTO_SECRET || 'default-secret');

      const isMicrosoft = provider === PROVIDER_TYPES.MICROSOFT;

      const credentialData = {
        userId: user._id,
        emailId: email.toLowerCase(),
        password: encryptedPassword,
        meetingLink,
        provider,
        ...(isMicrosoft
          ? {}
          : {
              providerIMAPHost,
              providerIMAPPort,
              providerSMTPHost,
              providerSMTPPort,
              providerInboxName,
              providerSentBoxName,
            }),
      };

      // Create credentials in database
      const createdCredentials = await credentialsDb.createCredentials(credentialData);

      // Create EmailEngine integrations
      const emailEngineResult = await createEmailEngineIntegrations(
        createdCredentials,
        password,
        provider
      );

      if (!emailEngineResult.success) {
        // If EmailEngine integration fails, delete the credentials
        await credentialsDb.deleteCredentials(createdCredentials._id.toString());
        
        responses.push({
          email,
          success: false,
          error: emailEngineResult.error || 'Failed to connect to email service',
        });
        continue;
      }

      // Update credentials with EmailEngine IDs
      await credentialsDb.updateCredentials(createdCredentials._id.toString(), {
        emailEngineAccountId: emailEngineResult.accountId,
        emailEngineGatewayId: emailEngineResult.gatewayId,
      });

      responses.push({
        email,
        success: true,
        credentialsId: createdCredentials._id.toString(),
        redirectUrl: emailEngineResult.redirectUrl,
      });
    }

    return NextResponse.json(
      {
        message: 'Processed email credentials',
        results: responses,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating email credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
