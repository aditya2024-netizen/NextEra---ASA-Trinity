import { NotificationRecord } from '../types';
import { dbCreateNotification } from '../db/db';

export interface SendNotificationOptions {
  patientId: string;
  channel: 'PHONE_CALL' | 'SMS' | 'WHATSAPP';
  destination: string;
  messageContent: string;
}

export interface NotificationResult {
  success: boolean;
  isDemo: boolean;
  status: string;
  provider: string;
  message: string;
  notificationId: string;
}

export async function sendNotification(options: SendNotificationOptions): Promise<NotificationResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  const hasTwilioCredentials = 
    Boolean(accountSid && authToken && fromNumber) &&
    accountSid !== 'MY_TWILIO_ACCOUNT_SID' &&
    !accountSid?.startsWith('placeholder');

  const id = `NOTIF-${Date.now().toString().slice(-6)}`;
  let status = 'DEMO_SENT';
  let provider = 'Twilio Demo Mode (Simulated)';
  let isDemo = true;
  let resultMessage = `[Demo Mode] Simulated ${options.channel} successfully dispatched to ${options.destination}.`;

  if (options.channel === 'PHONE_CALL') {
    status = 'DEMO_CALL';
  }

  if (hasTwilioCredentials && options.channel === 'SMS') {
    try {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', options.destination);
      params.append('From', fromNumber!);
      params.append('Body', options.messageContent);

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      const twilioJson = await twilioRes.json();
      if (twilioRes.ok) {
        status = 'SENT';
        provider = 'Twilio Live API';
        isDemo = false;
        resultMessage = `[Live Twilio] SMS dispatched successfully to ${options.destination} (SID: ${twilioJson.sid}).`;
      } else {
        console.warn('[Twilio Error] Live API returned error, falling back to Demo Mode:', twilioJson.message);
        status = 'DEMO_SENT';
        provider = 'Twilio Demo Mode (Live Error Fallback)';
        resultMessage = `[Demo Mode Fallback] Twilio error (${twilioJson.message}), simulated message recorded.`;
      }
    } catch (err: any) {
      console.warn('[Twilio Network Error] Falling back to Demo Mode:', err.message);
      status = 'DEMO_SENT';
      provider = 'Twilio Demo Mode (Network Fallback)';
      resultMessage = `[Demo Mode Fallback] Twilio network failure, simulated message recorded.`;
    }
  }

  const notificationRecord: NotificationRecord = {
    id,
    patientId: options.patientId,
    channel: options.channel,
    destination: options.destination,
    messageContent: options.messageContent,
    status,
    provider,
    isDemo,
    createdAt: new Date().toISOString(),
  };

  await dbCreateNotification(notificationRecord);

  return {
    success: true,
    isDemo,
    status,
    provider,
    message: resultMessage,
    notificationId: id,
  };
}
