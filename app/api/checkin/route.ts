// 签到 API
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { NextResponse } from "next/server";
import { generateEncouragement } from "@/app/lib/encouragementAgent";
import { getTodayStartUTC, addDaysUTC } from "@/app/lib/timezone";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { emoji, mood } = await request.json();

    // 使用 UTC 时区的今天开始时间，数据库统一存储 UTC 时间
    const today = getTodayStartUTC();
    const tomorrow = addDaysUTC(today, 1);

    const existingCheckIn = await db.checkIn.findFirst({
      where: {
        userId: BigInt(session.user.id),
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingCheckIn) {
      return NextResponse.json({ error: "今天已经签到过了" }, { status: 400 });
    }

    let encouragement: string | null = null;

    if (mood === "思考" || mood === "疲惫" || mood === "悲伤") {
      encouragement = await generateEncouragement(mood);
    }

    const checkIn = await db.checkIn.create({
      data: {
        userId: BigInt(session.user.id),
        emoji: emoji || "🏃",
        mood: mood || "positive",
        encouragement,
        date: today,
      },
    });

    return NextResponse.json({
      success: true,
      checkIn: {
        ...checkIn,
        id: checkIn.id.toString(),
        userId: checkIn.userId.toString(),
      },
    });
  } catch (error) {
    console.error("签到失败:", error);
    return NextResponse.json(
      { error: "签到失败，请稍后重试" },
      { status: 500 }
    );
  }
}
