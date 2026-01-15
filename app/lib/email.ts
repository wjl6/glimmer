// 邮件发送服务
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "Glimmer <noreply@glimmer.app>",
      to,
      subject,
      text,
      html: html || text,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("邮件发送失败:", error);
    return { success: false, error: error instanceof Error ? error.message : "未知错误" };
  }
}
