// 重置密码 API
import { db } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, verificationCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度至少为 6 位" },
        { status: 400 }
      );
    }

    // 验证两次密码是否一致
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "两次输入的密码不一致" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 验证验证码
    if (!verificationCode) {
      return NextResponse.json(
        { error: "请输入验证码" },
        { status: 400 }
      );
    }

    // 查找有效的验证码
    // 使用当前 UTC 时间进行比较，确保时区一致性
    const now = new Date();
    const validCode = await db.emailVerificationCode.findFirst({
      where: {
        email,
        code: verificationCode,
        type: "reset_password",
        used: false,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!validCode) {
      return NextResponse.json(
        { error: "验证码无效或已过期，请重新获取" },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "该邮箱未注册" },
        { status: 400 }
      );
    }

    // 如果用户没有密码（OAuth用户），不允许重置密码
    if (!user.password) {
      return NextResponse.json(
        { error: "该账号使用第三方登录，无法重置密码" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // 使用事务确保密码更新和验证码标记为已使用同时完成
      await db.$transaction(async (tx) => {
        // 更新用户密码
        await tx.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
          },
        });

        // 标记验证码为已使用
        await tx.emailVerificationCode.update({
          where: { id: validCode.id },
          data: { used: true },
        });
      });
    } catch (updateError: any) {
      console.error("重置密码失败:", updateError);
      return NextResponse.json(
        { error: "重置密码失败，请稍后重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "密码重置成功",
    });
  } catch (error: any) {
    console.error("重置密码失败:", error);
    
    let errorMessage = "重置密码失败，请稍后重试";
    
    if (error instanceof SyntaxError) {
      errorMessage = "请求数据格式错误";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
