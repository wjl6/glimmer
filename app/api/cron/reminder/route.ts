// 失联检测和提醒的 Cron API
import { checkInactivityAndRemind } from "@/app/lib/reminder";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 简单的认证：检查请求头中的 secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    await checkInactivityAndRemind();
    return NextResponse.json({ success: true, message: "提醒检查完成" });
  } catch (error) {
    console.error("提醒检查失败:", error);
    return NextResponse.json(
      { error: "提醒检查失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
