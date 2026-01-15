// 提醒设置 API
import { auth } from "@/app/auth";
import { db } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { 
      enabled, 
      selfReminderEnabled, 
      selfReminderDays, 
      contactReminderEnabled, 
      contactReminderDays 
    } = await request.json();

    const settings = await db.reminderSettings.upsert({
      where: { userId: BigInt(session.user.id) },
      update: {
        enabled: Boolean(enabled),
        selfReminderEnabled: Boolean(selfReminderEnabled),
        selfReminderDays: Number(selfReminderDays),
        contactReminderEnabled: Boolean(contactReminderEnabled),
        contactReminderDays: Number(contactReminderDays),
      },
      create: {
        userId: BigInt(session.user.id),
        enabled: Boolean(enabled),
        selfReminderEnabled: Boolean(selfReminderEnabled),
        selfReminderDays: Number(selfReminderDays),
        contactReminderEnabled: Boolean(contactReminderEnabled),
        contactReminderDays: Number(contactReminderDays),
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        id: settings.id.toString(),
        userId: settings.userId.toString(),
      },
    });
  } catch (error) {
    console.error("保存设置失败:", error);
    return NextResponse.json(
      { error: "保存失败，请稍后重试" },
      { status: 500 }
    );
  }
}
