// SendGrid email service for FrisFocus
// Uses Replit SendGrid integration for authentication

import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getUncachableSendGridClient() {
  const { apiKey, email } = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

export interface InvitationEmailParams {
  toEmail: string;
  inviterName: string;
  inviteCode?: string;
  appUrl: string;
}

export async function sendInvitationEmail(params: InvitationEmailParams): Promise<boolean> {
  const { toEmail, inviterName, inviteCode, appUrl } = params;
  
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const inviteUrl = inviteCode 
      ? `${appUrl}?invite=${inviteCode}` 
      : appUrl;
    
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: `${inviterName} invited you to join FrisFocus!`,
      text: `
Hi there!

${inviterName} wants to connect with you on FrisFocus, a habit tracking app that helps you stay focused and accountable.

Join FrisFocus to:
- Track your daily habits and earn points
- Compete with friends in fun challenges
- Join circles and build accountability

Click here to join: ${inviteUrl}

See you there!
The FrisFocus Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f; color: #e5e5e5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #22c55e; font-size: 28px; margin: 0;">FrisFocus</h1>
      <p style="color: #737373; font-size: 14px; margin-top: 8px;">Build habits. Stay focused.</p>
    </div>
    
    <div style="background-color: #18181b; border-radius: 12px; padding: 32px; border: 1px solid #27272a;">
      <h2 style="color: #fafafa; font-size: 20px; margin: 0 0 16px 0;">You're Invited!</h2>
      
      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        <strong style="color: #22c55e;">${inviterName}</strong> wants to connect with you on FrisFocus, a habit tracking app that helps you stay focused and accountable.
      </p>
      
      <div style="background-color: #27272a; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #d4d4d8; font-size: 14px; margin: 0 0 12px 0;">Join FrisFocus to:</p>
        <ul style="color: #a1a1aa; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Track your daily habits and earn points</li>
          <li>Compete with friends in fun challenges</li>
          <li>Join circles and build accountability</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="${inviteUrl}" style="display: inline-block; background-color: #22c55e; color: #0a0a0f; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
          Join FrisFocus
        </a>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #525252; font-size: 12px; margin: 0;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
      `.trim()
    };
    
    await client.send(msg);
    return true;
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return false;
  }
}
