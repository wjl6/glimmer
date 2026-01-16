// 更新用户姓名 API
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { name } = await request.json();

    // 验证姓名长度（可选，允许清空）
    if (name && name.length > 50) {
      return NextResponse.json(
        { error: "姓名长度不能超过 50 个字符" },
        { status: 400 }
      );
    }

    // 更新用户姓名（允许设置为 null）
    const updatedUser = await db.user.update({
      where: { id: BigInt(session.user.id) },
      data: {
        name: name?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
      },
    });
  } catch (error) {
    console.error("更新姓名失败:", error);
    return NextResponse.json(
      { error: "更新失败，请稍后重试" },
      { status: 500 }
    );
  }
}
