// 失联检测和提醒系统
import { db } from "@/app/lib/db";
import { sendEmail } from "@/app/lib/email";
import {
  normalizeDateToUTC,
  getTodayStartUTC,
  calculateDaysBetween,
  addDaysUTC,
} from "@/app/lib/timezone";

const BATCH_SIZE = 100;

// 连续提醒阈值：用户连续收到多少条提醒后自动关闭提醒设置（可通过环境变量配置，默认7）
const CONSECUTIVE_REMINDER_THRESHOLD = Number(process.env.CONSECUTIVE_REMINDER_THRESHOLD) || 7;

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
      // 将数据库返回的日期标准化为 UTC 时区的日期（只保留日期部分，时间设为 00:00:00）
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

/**
 * 检查用户是否连续收到指定数量的提醒
 * 查询用户最近收到的提醒记录（包括用户自己和紧急联系人收到的），
 * 如果最近的指定数量条记录都是提醒（没有签到记录打断），则返回true
 * @param userId 用户ID
 * @param currentReminderCount 当前这次发送的提醒数量（还未保存到数据库）
 * @param threshold 连续提醒阈值，默认使用全局配置值
 */
async function hasConsecutiveReminders(
  userId: bigint,
  currentReminderCount: number = 0,
  threshold: number = CONSECUTIVE_REMINDER_THRESHOLD
): Promise<boolean> {
  // 查询用户最近收到的提醒记录（包括 self 和 contact 类型，按时间倒序）
  // 查询数量设为阈值+3，以确保有足够的数据判断
  const recentReminders = await db.notificationLog.findMany({
    where: {
      userId: userId,
      status: "sent",
      type: { in: ["self", "contact"] }, // 包括用户自己和紧急联系人收到的提醒
    },
    orderBy: {
      createdAt: "desc",
    },
    take: threshold + 3, // 查询足够多的记录以确保有足够的数据判断
    select: {
      createdAt: true,
      type: true,
    },
  });

  // 计算总提醒数量：数据库中的记录 + 当前这次发送的提醒
  const totalReminderCount = recentReminders.length + currentReminderCount;

  // 如果总提醒记录少于阈值，不满足条件
  if (totalReminderCount < threshold) {
    return false;
  }

  // 获取用户最后一次签到的时间
  const lastCheckIn = await db.checkIn.findFirst({
    where: {
      userId: userId,
    },
    orderBy: {
      date: "desc",
    },
    select: {
      date: true,
    },
  });

  // 取最近的阈值条提醒（如果数据库中的记录加上当前这次发送的提醒达到阈值）
  // 我们需要确保数据库中有足够的记录，或者数据库中的记录 + 当前这次发送的提醒 >= 阈值
  const neededFromDb = Math.max(0, threshold - currentReminderCount);
  
  if (neededFromDb > 0 && recentReminders.length < neededFromDb) {
    return false;
  }

  // 取数据库中最近的记录（需要确保至少有 neededFromDb 条）
  const latestRemindersFromDb = recentReminders.slice(0, neededFromDb);

  // 如果最后一次签到存在，检查是否在最近的提醒之后
  // 如果最后一次签到在最近的提醒之后，说明有签到记录打断了提醒，不满足连续条件
  if (lastCheckIn && latestRemindersFromDb.length > 0) {
    const lastCheckInTime = normalizeDateToUTC(lastCheckIn.date);
    const oldestReminderTime = latestRemindersFromDb[latestRemindersFromDb.length - 1].createdAt;

    // 如果最后一次签到在最近的提醒之后，说明有签到记录打断了提醒
    if (lastCheckInTime > oldestReminderTime) {
      return false;
    }
  }

  // 如果满足以上条件，认为用户连续收到了指定数量的提醒
  return true;
}

function calculateDaysSinceLastCheckIn(
  lastCheckIn: Date | null,
  now: Date,
  defaultDays: number
): number {
  if (!lastCheckIn) {
    return defaultDays;
  }
  // 标准化日期为 UTC 时区的 00:00:00，确保日期比较准确
  return calculateDaysBetween(lastCheckIn, now);
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
  recipientEmail: string;
}>> {
  const logs: Array<{
    userId: bigint;
    type: string;
    status: string;
    content: string;
    error: string | null;
    recipientEmail: string;
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
        recipientEmail: user.email,
      });
    } catch (error) {
      console.error(`用户 ${user.id} 的自提醒发送失败:`, error);
      logs.push({
        userId: user.id,
        type: "self",
        status: "failed",
        content: "",
        error: error instanceof Error ? error.message : "未知错误",
        recipientEmail: user.email || "",
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
  recipientEmail: string;
}>> {
  const logs: Array<{
    userId: bigint;
    type: string;
    status: string;
    content: string;
    error: string | null;
    recipientEmail: string;
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
          recipientEmail: contact.email,
        });
      } catch (error) {
        console.error(`用户 ${user.id} 的联系人 ${contact.email} 提醒发送失败:`, error);
        logs.push({
          userId: user.id,
          type: "contact",
          status: "failed",
          content: contactText,
          error: error instanceof Error ? error.message : "未知错误",
          recipientEmail: contact.email,
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
    recipientEmail: string;
  }>
): Promise<void> {
  if (logs.length === 0) {
    return;
  }

  try {
    const result = await db.notificationLog.createMany({
      data: logs,
      skipDuplicates: true,
    });
    console.log(`成功创建 ${result.count} 条通知日志（期望 ${logs.length} 条）`);
    if (result.count < logs.length) {
      console.warn(`警告: 只创建了 ${result.count} 条，期望 ${logs.length} 条`);
    }
  } catch (error) {
    console.error("批量创建通知日志失败:", error);
    console.error("错误详情:", error instanceof Error ? error.stack : String(error));
    // 批量创建失败时，尝试逐个创建
    let successCount = 0;
    let failCount = 0;
    for (const log of logs) {
      try {
        await db.notificationLog.create({
          data: log,
        });
        successCount++;
      } catch (singleError) {
        failCount++;
        console.error(`创建单个通知日志失败 (userId: ${log.userId}, type: ${log.type}, recipient: ${log.recipientEmail}):`, singleError);
      }
    }
    console.log(`逐个创建日志结果: 成功 ${successCount} 条, 失败 ${failCount} 条`);
  }
}

export async function checkInactivityAndRemind() {
  const now = new Date();
  // 使用 UTC 时区的今天开始时间，确保时区一致性
  const todayStart = getTodayStartUTC();

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
      recipientEmail: string;
    }> = [];

    // 记录需要关闭提醒的用户 ID
    const usersToDisable: bigint[] = [];

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
        const todayUTC = getTodayStartUTC();

        let reminderSent = false;

        // 分别处理自我提醒
        if (selfReminderEnabled && !todayReminders.self) {
          // 计算自我提醒的阈值日期（UTC 时区）
          const selfCheckDate = addDaysUTC(todayUTC, -selfReminderDays);

          // 标准化 lastCheckIn 为 UTC 时区日期进行比较
          const normalizedLastCheckIn = lastCheckIn ? normalizeDateToUTC(lastCheckIn) : null;
          // 如果最后一次签到日期 <= 阈值日期，说明已经达到或超过提醒天数，需要提醒
          const isSelfInactive = !normalizedLastCheckIn || normalizedLastCheckIn <= selfCheckDate;

          if (isSelfInactive) {
            const selfDaysSince = calculateDaysSinceLastCheckIn(
              lastCheckIn,
              now,
              selfReminderDays
            );

            const selfLogs = await processSelfReminder(
              user,
              lastCheckIn,
              selfDaysSince
            );
            notificationLogs.push(...selfLogs);

            // 如果成功发送了提醒（基于邮件发送结果，而非日志创建结果），标记为已发送
            if (selfLogs.length > 0 && selfLogs.some(log => log.status === "sent")) {
              reminderSent = true;
            }
          }
        }

        // 分别处理联系人提醒
        if (contactReminderEnabled && !todayReminders.contact) {
          // 计算联系人提醒的阈值日期（UTC 时区）
          const contactCheckDate = addDaysUTC(todayUTC, -contactReminderDays);

          // 标准化 lastCheckIn 为 UTC 时区日期进行比较
          const normalizedLastCheckIn = lastCheckIn ? normalizeDateToUTC(lastCheckIn) : null;
          // 如果最后一次签到日期 <= 阈值日期，说明已经达到或超过提醒天数，需要提醒
          const isContactInactive = !normalizedLastCheckIn || normalizedLastCheckIn <= contactCheckDate;

          if (isContactInactive) {
            const contactDaysSince = calculateDaysSinceLastCheckIn(
              lastCheckIn,
              now,
              contactReminderDays
            );

            const contactLogs = await processContactReminder(
              user,
              lastCheckIn,
              contactDaysSince
            );
            notificationLogs.push(...contactLogs);

            // 如果成功发送了提醒（基于邮件发送结果，而非日志创建结果），标记为已发送
            if (contactLogs.length > 0 && contactLogs.some(log => log.status === "sent")) {
              reminderSent = true;
            }
          }
        }

        // 如果已发送提醒，检查是否连续收到指定数量的提醒
        if (reminderSent) {
          // 计算当前这次发送的提醒数量（还未保存到数据库）
          const currentReminderCount = notificationLogs.filter(
            log => log.userId === user.id && log.status === "sent"
          ).length;
          
          const hasConsecutive = await hasConsecutiveReminders(user.id, currentReminderCount);
          if (hasConsecutive) {
            usersToDisable.push(user.id);
            console.log(`用户 ${user.id} (${user.email}) 已连续收到 ${CONSECUTIVE_REMINDER_THRESHOLD} 条提醒（包括当前这次发送的 ${currentReminderCount} 条），将关闭提醒设置`);
          }
        }
      } catch (error) {
        console.error(`处理用户 ${user.id} 的提醒时发生错误:`, error);
      }
    }

    // 先保存日志，再关闭提醒设置（确保日志记录完整）
    if (notificationLogs.length > 0) {
      await batchCreateNotificationLogs(notificationLogs);
    }

    // 关闭已放弃用户的提醒设置（连续收到7条提醒后）
    if (usersToDisable.length > 0) {
      try {
        const updateResult = await db.reminderSettings.updateMany({
          where: {
            userId: { in: usersToDisable },
          },
          data: {
            enabled: false,
          },
        });
        console.log(`已关闭 ${updateResult.count} 个用户的提醒设置（连续收到 ${CONSECUTIVE_REMINDER_THRESHOLD} 条提醒）`);
        if (updateResult.count !== usersToDisable.length) {
          console.warn(`警告: 期望关闭 ${usersToDisable.length} 个用户，实际关闭 ${updateResult.count} 个`);
        }
      } catch (error) {
        console.error("关闭提醒设置失败:", error);
        console.error("错误详情:", error instanceof Error ? error.stack : String(error));
      }
    }

    skip += BATCH_SIZE;
  }
}
