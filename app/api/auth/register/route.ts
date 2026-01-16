// 注册 API
import { db } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, name, verificationCode } = body;

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

    let existingUser;
    try {
      existingUser = await db.user.findUnique({
        where: { email },
      });
    } catch (dbError) {
      console.error("数据库查询错误:", dbError);
      return NextResponse.json(
        { error: "数据库连接失败，请稍后重试" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
      // 使用事务确保用户创建和验证码标记为已使用同时完成
      const result = await db.$transaction(async (tx) => {
        // 创建用户
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name: name || null,
            emailVerified: new Date(), // 验证码验证通过，标记邮箱已验证
          },
        });

        // 标记验证码为已使用
        await tx.emailVerificationCode.update({
          where: { id: validCode.id },
          data: { used: true },
        });

        return newUser;
      });

      user = result;
    } catch (createError: any) {
      console.error("创建用户失败:", createError);
      
      if (createError?.code === "P2002") {
        return NextResponse.json(
          { error: "该邮箱已被注册" },
          { status: 400 }
        );
      }

      const errorMessage = createError?.message || "创建用户失败";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("注册失败:", error);
    
    let errorMessage = "注册失败，请稍后重试";
    
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
