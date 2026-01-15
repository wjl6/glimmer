// 失联检测和提醒系统
import { db } from "@/app/lib/db";
import { sendEmail } from "@/app/lib/email";

const BATCH_SIZE = 100;

/**
 * 将日期标准化为 UTC 时区的 00:00:00
 * 用于统一日期比较，避免时区问题
 */
function normalizeDateToUTC(date: Date): Date {
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0,
    0,
    0,
    0
  ));
  return utcDate;
}

/**
 * 获取当前 UTC 日期的 00:00:00
 */
function getTodayUTCStart(): Date {
  const now = new Date();
  return normalizeDateToUTC(now);
}

interface UserWithRelations {
  id: bigint;
  email: string | null;
  name: string | null;
  reminderSettings: {
    enabled: boolean;
    selfReminderEnabled: boolean;
    selfReminderDays: number;
    contactReminderEnabled: boolean;
    contactReminderDays: number;
  } | null;
  emergencyContacts: Array<{
    email: string;
  }>;
}

interface LastCheckInMap {
  [userId: string]: Date | null;
}

interface TodayReminderMap {
  [userId: string]: {
    self: boolean;
    contact: boolean;
  };
}

async function fetchUsersBatch(skip: number, take: number): Promise<UserWithRelations[]> {
  return await db.user.findMany({
    skip,
    take,
    where: {
      reminderSettings: {
        enabled: true,
      },
    },
    include: {
      reminderSettings: true,
      emergencyContacts: {
        where: { enabled: true },
        select: {
          email: true,
        },
      },
    },
  });
}

async function fetchLastCheckIns(userIds: bigint[]): Promise<LastCheckInMap> {
  if (userIds.length === 0) {
    return {};
  }

  const checkIns = await db.checkIn.findMany({
    where: {
      userId: { in: userIds },
    },
    select: {
      userId: true,
      date: true,
    },
    orderBy: [
      { userId: "asc" },
      { date: "desc" },
    ],
  });

  const lastCheckInMap: LastCheckInMap = {};
  const processedUsers = new Set<string>();

  for (const checkIn of checkIns) {
    const userIdStr = checkIn.userId.toString();
    if (!processedUsers.has(userIdStr)) {
      // 将数据库返回的日期标准化为 UTC 日期（只保留日期部分，时间设为 00:00:00）
      const normalizedDate = normalizeDateToUTC(checkIn.date);
      lastCheckInMap[userIdStr] = normalizedDate;
      processedUsers.add(userIdStr);
    }
  }

  for (const userId of userIds) {
    const userIdStr = userId.toString();
    if (!lastCheckInMap[userIdStr]) {
      lastCheckInMap[userIdStr] = null;
    }
  }

  return lastCheckInMap;
}

async function fetchTodayReminders(userIds: bigint[], todayStart: Date): Promise<TodayReminderMap> {
  if (userIds.length === 0) {
    return {};
  }

  const reminders = await db.notificationLog.findMany({
    where: {
      userId: { in: userIds },
      createdAt: {
        gte: todayStart,
      },
      status: "sent",
    },
    select: {
      userId: true,
      type: true,
    },
  });

  const reminderMap: TodayReminderMap = {};

  // 初始化所有用户的状态
  for (const userId of userIds) {
    const userIdStr = userId.toString();
    reminderMap[userIdStr] = { self: false, contact: false };
  }

  // 标记今天已发送的提醒类型
  for (const reminder of reminders) {
    const userIdStr = reminder.userId.toString();
    if (reminder.type === "self") {
      reminderMap[userIdStr].self = true;
    } else if (reminder.type === "contact") {
      reminderMap[userIdStr].contact = true;
    }
  }

  return reminderMap;
}

function calculateDaysSinceLastCheckIn(
  lastCheckIn: Date | null,
  now: Date,
  defaultDays: number
): number {
  if (!lastCheckIn) {
    return defaultDays;
  }
  // 标准化日期为 UTC 的 00:00:00，确保日期比较准确
  const normalizedLastCheckIn = normalizeDateToUTC(lastCheckIn);
  const normalizedNow = normalizeDateToUTC(now);
  return Math.floor((normalizedNow.getTime() - normalizedLastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
}

async function processSelfReminder(
  user: UserWithRelations,
  lastCheckIn: Date | null,
  daysSinceLastCheckIn: number
): Promise<Array<{
  userId: bigint;
  type: string;
  status: string;
  content: string;
  error: string | null;
}>> {
  const logs: Array<{
    userId: bigint;
    type: string;
    status: string;
    content: string;
    error: string | null;
  }> = [];

  if (!user.reminderSettings || !user.reminderSettings.selfReminderEnabled || !user.email) {
    return logs;
  }

  const { selfReminderDays } = user.reminderSettings;

  // 检查是否达到自我提醒的天数阈值
  if (daysSinceLastCheckIn >= selfReminderDays) {
    try {
      const emailText = `你好，

你已经 ${daysSinceLastCheckIn} 天没有签到了。

如果一切正常，可以随时回来签到。

— 微光 Glimmer`;

      const emailHtml = `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f7f8fa;">
    <div style="max-width:600px; margin:0 auto; padding:24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#333; line-height:1.6;">
      <p>你好，</p>

      <p>
        你已经 <strong>${daysSinceLastCheckIn} 天</strong> 没有在微光签到或留下近况了。
      </p>

      <p>
        希望你能一切安好；
      </p>
      
      <p>
        如果你正经历一些不容易的时刻，希望这封邮件能成为一盏微小但温暖的光。
      </p>

      <p style="margin-top:32px; color:#999;">
        — 微光 Glimmer
      </p>

    </div>
  </body>
</html>`;

      const result = await sendEmail({
        to: user.email,
        subject: "一盏微光提醒",
        text: "",
        html: emailHtml,
      });

      logs.push({
        userId: user.id,
        type: "self",
        status: result.success ? "sent" : "failed",
        content: emailText,
        error: result.success ? null : result.error || null,
      });
    } catch (error) {
      console.error(`用户 ${user.id} 的自提醒发送失败:`, error);
      logs.push({
        userId: user.id,
        type: "self",
        status: "failed",
        content: "",
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  }

  return logs;
}

async function processContactReminder(
  user: UserWithRelations,
  lastCheckIn: Date | null,
  daysSinceLastCheckIn: number
): Promise<Array<{
  userId: bigint;
  type: string;
  status: string;
  content: string;
  error: string | null;
}>> {
  const logs: Array<{
    userId: bigint;
    type: string;
    status: string;
    content: string;
    error: string | null;
  }> = [];

  if (!user.reminderSettings || !user.reminderSettings.contactReminderEnabled || user.emergencyContacts.length === 0) {
    return logs;
  }

  const { contactReminderDays } = user.reminderSettings;

  // 检查是否达到联系人提醒的天数阈值
  if (daysSinceLastCheckIn >= contactReminderDays) {
    const userName = user.name || user.email || "用户";
    const contactText = `你好，

这是来自 微光（Glimmer） 的一条提醒。

${userName} 已经有 ${daysSinceLastCheckIn} 天 没有在微光签到或留下近况了。

如果一切都还好，可以轻轻提醒他们回来签到一下；
如果他们正经历一些不容易的时刻，希望这封邮件能成为一盏微小但温暖的光。

祝一切安好。
— 微光 Glimmer`;

    const contactHtml = `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f7f8fa;">
    <div style="max-width:600px; margin:0 auto; padding:24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#333; line-height:1.6;">
      
      <p>你好，</p>

      <p>
        这是来自 <strong>微光（Glimmer）</strong> 的一条提醒。
      </p>

      <p>
        <strong>${userName}</strong> 已经有 <strong>${daysSinceLastCheckIn} 天</strong> 没有在微光留下近况了。
      </p>

      <p>
        如果一切都还好，可以轻轻提醒他们回来留下近况；<br />
        如果他们正经历一些不容易的时刻，希望这封邮件能成为一盏微小但温暖的光。
      </p>

      <p>
        祝一切安好。
      </p>

      <p style="margin-top:32px; color:#999;">
        — 微光 Glimmer
      </p>

    </div>
  </body>
</html>`;

    for (const contact of user.emergencyContacts) {
      try {
        const result = await sendEmail({
          to: contact.email,
          subject: `关于 ${userName} 的一盏微光提醒`,
          text: "contactText",
          html: contactHtml,
        });

        logs.push({
          userId: user.id,
          type: "contact",
          status: result.success ? "sent" : "failed",
          content: contactText,
          error: result.success ? null : result.error || null,
        });
      } catch (error) {
        console.error(`用户 ${user.id} 的联系人 ${contact.email} 提醒发送失败:`, error);
        logs.push({
          userId: user.id,
          type: "contact",
          status: "failed",
          content: contactText,
          error: error instanceof Error ? error.message : "未知错误",
        });
      }
    }
  }

  return logs;
}

async function batchCreateNotificationLogs(
  logs: Array<{
    userId: bigint;
    type: string;
    status: string;
    content: string;
    error: string | null;
  }>
): Promise<void> {
  if (logs.length === 0) {
    return;
  }

  try {
    await db.notificationLog.createMany({
      data: logs,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("批量创建通知日志失败:", error);
    for (const log of logs) {
      try {
        await db.notificationLog.create({
          data: log,
        });
      } catch (singleError) {
        console.error(`创建单个通知日志失败 (userId: ${log.userId}, type: ${log.type}):`, singleError);
      }
    }
  }
}

export async function checkInactivityAndRemind() {
  const now = new Date();
  // 使用 UTC 时区的今天开始时间，确保时区一致性
  const todayStart = getTodayUTCStart();

  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const users = await fetchUsersBatch(skip, BATCH_SIZE);

    if (users.length === 0) {
      hasMore = false;
      break;
    }

    if (users.length < BATCH_SIZE) {
      hasMore = false;
    }

    const userIds = users.map((u) => u.id);
    const validUsers = users.filter((u) => {
      return u.reminderSettings !== null && u.reminderSettings.enabled === true;
    });

    if (validUsers.length === 0) {
      skip += BATCH_SIZE;
      continue;
    }

    const lastCheckInMap = await fetchLastCheckIns(userIds);
    const todayReminderMap = await fetchTodayReminders(userIds, todayStart);

    const notificationLogs: Array<{
      userId: bigint;
      type: string;
      status: string;
      content: string;
      error: string | null;
    }> = [];

    for (const user of validUsers) {
      try {
        const userIdStr = user.id.toString();

        if (!user.reminderSettings) {
          continue;
        }

        const { selfReminderEnabled, selfReminderDays, contactReminderEnabled, contactReminderDays } = user.reminderSettings;
        const lastCheckIn = lastCheckInMap[userIdStr];
        const todayReminders = todayReminderMap[userIdStr] || { self: false, contact: false };

        // 使用 UTC 时区的今天作为基准
        const todayUTC = getTodayUTCStart();

        // 分别处理自我提醒
        if (selfReminderEnabled && !todayReminders.self) {
          // 计算自我提醒的阈值日期（UTC）
          const selfCheckDate = new Date(Date.UTC(
            todayUTC.getUTCFullYear(),
            todayUTC.getUTCMonth(),
            todayUTC.getUTCDate() - selfReminderDays,
            0,
            0,
            0,
            0
          ));

          // 标准化 lastCheckIn 为 UTC 日期进行比较
          const normalizedLastCheckIn = lastCheckIn ? normalizeDateToUTC(lastCheckIn) : null;
          const isSelfInactive = !normalizedLastCheckIn || normalizedLastCheckIn < selfCheckDate;

          if (isSelfInactive) {
            const daysSinceLastCheckIn = calculateDaysSinceLastCheckIn(
              lastCheckIn,
              now,
              selfReminderDays
            );

            const selfLogs = await processSelfReminder(
              user,
              lastCheckIn,
              daysSinceLastCheckIn
            );
            notificationLogs.push(...selfLogs);
          }
        }

        // 分别处理联系人提醒
        if (contactReminderEnabled && !todayReminders.contact) {
          // 计算联系人提醒的阈值日期（UTC）
          const contactCheckDate = new Date(Date.UTC(
            todayUTC.getUTCFullYear(),
            todayUTC.getUTCMonth(),
            todayUTC.getUTCDate() - contactReminderDays,
            0,
            0,
            0,
            0
          ));

          // 标准化 lastCheckIn 为 UTC 日期进行比较
          const normalizedLastCheckIn = lastCheckIn ? normalizeDateToUTC(lastCheckIn) : null;
          const isContactInactive = !normalizedLastCheckIn || normalizedLastCheckIn < contactCheckDate;

          if (isContactInactive) {
            const daysSinceLastCheckIn = calculateDaysSinceLastCheckIn(
              lastCheckIn,
              now,
              contactReminderDays
            );

            const contactLogs = await processContactReminder(
              user,
              lastCheckIn,
              daysSinceLastCheckIn
            );
            notificationLogs.push(...contactLogs);
          }
        }
      } catch (error) {
        console.error(`处理用户 ${user.id} 的提醒时发生错误:`, error);
      }
    }

    if (notificationLogs.length > 0) {
      await batchCreateNotificationLogs(notificationLogs);
    }

    skip += BATCH_SIZE;
  }
}
