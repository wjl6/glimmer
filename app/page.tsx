// 首页 - 签到页面
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import CheckInForm from "@/app/components/CheckInForm";
import { db } from "@/app/lib/db";
import { getTodayStartUTC, addDaysUTC, formatDateForDisplay } from "@/app/lib/timezone";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // 获取今日签到记录（使用 UTC 时区，数据库统一存储 UTC 时间）
  const today = getTodayStartUTC();
  const tomorrow = addDaysUTC(today, 1);

  const todayCheckIn = await db.checkIn.findFirst({
    where: {
      userId: BigInt(session.user.id),
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  // 获取最近7天的签到记录
  const sevenDaysAgo = addDaysUTC(today, -7);

  const recentCheckIns = await db.checkIn.findMany({
    where: {
      userId: BigInt(session.user.id),
      date: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-medium text-zinc-900 dark:text-zinc-50">
          你好，{session.user.name || "朋友"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          今天过得怎么样？
        </p>
      </div>

      <CheckInForm
        hasCheckedIn={!!todayCheckIn}
        todayEncouragement={todayCheckIn?.encouragement ?? null}
        todayEmoji={todayCheckIn?.emoji ?? "🏃"}
      />

      {recentCheckIns.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            最近记录
          </h2>
          <div className="space-y-2">
            {recentCheckIns.map((checkIn) => (
              <div
                key={checkIn.id.toString()}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDateForDisplay(checkIn.date, {
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{checkIn.emoji || "🏃"}</span>
                    {checkIn.mood && (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {checkIn.mood}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
