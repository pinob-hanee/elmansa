import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

const smtpConfigured = !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      secure: parseInt(env.SMTP_PORT) === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: SendMailOptions): Promise<void> => {
  if (!transporter) {
    logger.info(`[DEV] Email skipped (SMTP not configured) → ${options.to} | ${options.subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM}>`,
      ...options,
    });
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

export const emailTemplates = {
  verifyEmail: (name: string, verifyUrl: string) => ({
    subject: 'تحقق من بريدك الإلكتروني - Elmansa',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"><style>
        body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .body { padding: 40px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; margin: 20px 0; }
        .footer { background: #0f172a; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header"><h1>🎓 Elmansa</h1></div>
          <div class="body">
            <h2>مرحباً ${name}!</h2>
            <p>شكراً لتسجيلك في منصة Elmansa التعليمية. يرجى تأكيد بريدك الإلكتروني للمتابعة.</p>
            <div style="text-align: center;">
              <a href="${verifyUrl}" class="btn">تأكيد البريد الإلكتروني</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">هذا الرابط صالح لمدة 24 ساعة. إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد.</p>
          </div>
          <div class="footer">© 2024 Elmansa. All rights reserved.</div>
        </div>
      </body>
      </html>
    `,
  }),

  passwordReset: (name: string, resetUrl: string) => ({
    subject: 'إعادة تعيين كلمة المرور - Elmansa',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"><style>
        body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #ef4444, #f97316); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .body { padding: 40px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; margin: 20px 0; }
        .footer { background: #0f172a; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header"><h1>🔐 إعادة تعيين كلمة المرور</h1></div>
          <div class="body">
            <h2>مرحباً ${name}!</h2>
            <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="btn">إعادة تعيين كلمة المرور</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة التعيين، تجاهل هذا البريد.</p>
          </div>
          <div class="footer">© 2024 Elmansa. All rights reserved.</div>
        </div>
      </body>
      </html>
    `,
  }),

  enrollmentApproved: (name: string, courseName: string, courseUrl: string) => ({
    subject: `تم قبول تسجيلك في ${courseName} - Elmansa`,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"><style>
        body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; }
        .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #10b981, #06b6d4); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .body { padding: 40px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; }
      </style></head>
      <body>
        <div class="container">
          <div class="header"><h1>🎉 تهانينا!</h1></div>
          <div class="body">
            <h2>مرحباً ${name}!</h2>
            <p>يسعدنا إخبارك بأنه تم قبول تسجيلك في كورس <strong>${courseName}</strong>. يمكنك الآن البدء في التعلم!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${courseUrl}" class="btn">ابدأ التعلم الآن</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};
