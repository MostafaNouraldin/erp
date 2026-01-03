
'use server';

import * as nodemailer from 'nodemailer';
import { getCompanySettings } from '@/app/settings/actions';
import * as fs from 'fs/promises';
import * as path from 'path';

// This is a placeholder for the tenantId. In a multi-tenant setup,
// this would be dynamically determined, but for a single system-wide
// email setting, we can use a fixed ID or the main tenant's ID.
const SETTINGS_TENANT_ID = 'T001';

async function createTransporter() {
  const settings = await getCompanySettings(SETTINGS_TENANT_ID);

  if (!settings?.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.smtpPass) {
    console.error("SMTP settings are not configured. Cannot send email.");
    throw new Error("SMTP settings are not configured in the system.");
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure, // true for 465, false for other ports
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });

  return transporter;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"نظام المستقبل ERP" <${process.env.SMTP_FROM_EMAIL || 'no-reply@example.com'}>`,
      ...options,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Failed to send email. Please check SMTP configuration and logs.");
  }
}

interface ActivationEmailPayload {
    companyName: string;
    name: string;
    email: string;
    password: string;
}

export async function sendActivationEmail(payload: ActivationEmailPayload) {
    const templatePath = path.join(process.cwd(), 'src', 'lib', 'email-templates', 'activation-email.html');
    let htmlContent = await fs.readFile(templatePath, 'utf-8');

    htmlContent = htmlContent
        .replace('{{companyName}}', payload.companyName)
        .replace('{{name}}', payload.name)
        .replace('{{email}}', payload.email)
        .replace('{{password}}', payload.password)
        .replace('{{loginUrl}}', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002/login');

    await sendEmail({
        to: payload.email,
        subject: 'تم تفعيل اشتراكك في نظام المستقبل ERP',
        html: htmlContent,
    });
}
