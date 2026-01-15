// 注册 API
import { db } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

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

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
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
      user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          emailVerified: null,
        },
      });
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
