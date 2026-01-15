// 发送邮箱验证码 API
import { db } from "@/app/lib/db";
import { sendEmail } from "@/app/lib/email";
import { NextResponse } from "next/server";

// 生成6位数字验证码
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 检查60秒内是否已发送过验证码
    // 使用当前时间（JavaScript Date 对象内部使用 UTC 时间戳）
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    const recentCode = await db.emailVerificationCode.findFirst({
      where: {
        email,
        createdAt: {
          gte: oneMinuteAgo,
        },
        used: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentCode) {
      // 计算剩余时间（使用时间戳差值，避免时区问题）
      const timeDiff = now.getTime() - recentCode.createdAt.getTime();
      const secondsLeft = Math.max(0, Math.ceil((60 * 1000 - timeDiff) / 1000));
      return NextResponse.json(
        { error: `请等待 ${secondsLeft} 秒后再试` },
        { status: 429 }
      );
    }

    // 生成验证码
    const code = generateVerificationCode();
    // 15分钟后过期（使用时间戳计算，确保准确性）
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    // 保存验证码到数据库
    // 明确指定 createdAt 和 expiresAt，确保时间一致性
    await db.emailVerificationCode.create({
      data: {
        email,
        code,
        createdAt: now,
        expiresAt,
      },
    });

    // 发送验证码邮件
    const emailHtml = `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f7f8fa;">
    <div style="max-width:600px; margin:0 auto; padding:24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#333; line-height:1.6;">
      
      <p>你好，</p>

      <p>
        这是来自 <strong>微光（Glimmer）</strong> 的验证码。
      </p>

      <p>
        你的验证码是：<strong style="font-size:24px; color:#333;">${code}</strong>
      </p>

      <p>
        验证码有效期为 <strong>15 分钟</strong>，请勿泄露给他人。
      </p>

      <p style="margin-top:32px; color:#999;">
        — 微光 Glimmer
      </p>

    </div>
  </body>
</html>`;

    const emailText = `你好，

这是来自 微光（Glimmer） 的验证码。

你的验证码是：${code}

验证码有效期为 15 分钟，请勿泄露给他人。

— 微光 Glimmer`;

    const emailResult = await sendEmail({
      to: email,
      subject: "微光注册验证码",
      text: emailText,
      html: emailHtml,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "验证码发送失败，请稍后重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送",
    });
  } catch (error) {
    console.error("发送验证码失败:", error);
    return NextResponse.json(
      { error: "发送验证码失败，请稍后重试" },
      { status: 500 }
    );
  }
}
