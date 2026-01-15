// 失联检测和提醒系统
import { db } from "@/app/lib/db";
import { sendEmail } from "@/app/lib/email";

export async function checkInactivityAndRemind() {
  const users = await db.user.findMany({
    include: {
      reminderSettings: true,
      emergencyContacts: {
        where: { enabled: true },
      },
    },
  });

  const now = new Date();

  for (const user of users) {
    if (!user.reminderSettings || !user.reminderSettings.enabled) {
      continue;
    }

    const { inactivityDays, selfReminderEnabled, contactReminderEnabled } =
      user.reminderSettings;

    // 计算应该签到的日期范围
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - inactivityDays);
    checkDate.setHours(0, 0, 0, 0);

    // 查找最后一次签到
    const lastCheckIn = await db.checkIn.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    // 如果没有签到记录，或者最后一次签到早于检测日期
    const isInactive =
      !lastCheckIn || new Date(lastCheckIn.date) < checkDate;

    if (isInactive) {
      // 检查今天是否已经发送过提醒
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const todayReminder = await db.notificationLog.findFirst({
        where: {
          userId: user.id,
          createdAt: {
            gte: todayStart,
          },
          status: "sent",
        },
      });

      if (todayReminder) {
        continue;
      }

      // 给自己发送提醒
      if (selfReminderEnabled && user.email) {
        const daysSinceLastCheckIn = lastCheckIn
          ? Math.floor(
              (now.getTime() - new Date(lastCheckIn.date).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : inactivityDays;

        const emailContent = `你好，

你已经 ${daysSinceLastCheckIn} 天没有签到了。

如果一切正常，可以随时回来签到。

微光`;

        const result = await sendEmail({
          to: user.email,
          subject: "签到提醒",
          text: emailContent,
        });

        await db.notificationLog.create({
          data: {
            userId: user.id,
            type: "self",
            status: result.success ? "sent" : "failed",
            content: emailContent,
            error: result.success ? null : result.error,
          },
        });
      }

      // 通知紧急联系人
      if (contactReminderEnabled && user.emergencyContacts.length > 0) {
        const daysSinceLastCheckIn = lastCheckIn
          ? Math.floor(
              (now.getTime() - new Date(lastCheckIn.date).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : inactivityDays;

        const contactContent = `你好，

${user.name || user.email} 已经 ${daysSinceLastCheckIn} 天没有在微光签到了。

如果一切正常，可以提醒他们回来签到。

微光`;

        for (const contact of user.emergencyContacts) {
          const result = await sendEmail({
            to: contact.email,
            subject: `关于 ${user.name || user.email} 的签到提醒`,
            text: contactContent,
          });

          await db.notificationLog.create({
            data: {
              userId: user.id,
              type: "contact",
              status: result.success ? "sent" : "failed",
              content: contactContent,
              error: result.success ? null : result.error,
            },
          });
        }
      }
    }
  }
}
