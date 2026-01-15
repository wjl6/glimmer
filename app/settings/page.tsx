// 设置页面
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/db";
import ReminderSettings from "@/app/components/ReminderSettings";
import EmergencyContacts from "@/app/components/EmergencyContacts";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // 获取提醒设置
  let reminderSettings = await db.reminderSettings.findUnique({
    where: { userId: BigInt(session.user.id) },
  });

  // 如果没有设置，创建默认设置
  if (!reminderSettings) {
    reminderSettings = await db.reminderSettings.create({
      data: {
        userId: BigInt(session.user.id),
      },
    });
  }

  // 获取紧急联系人
  const emergencyContacts = await db.emergencyContact.findMany({
    where: { userId: BigInt(session.user.id) },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/*<h1 className="mb-8 text-2xl font-medium text-zinc-900 dark:text-zinc-50">*/}
      {/*  设置*/}
      {/*</h1>*/}

      <div className="space-y-8">
        <ReminderSettings
          settings={{
            id: reminderSettings.id.toString(),
            enabled: reminderSettings.enabled,
            selfReminderEnabled: reminderSettings.selfReminderEnabled,
            selfReminderDays: reminderSettings.selfReminderDays,
            contactReminderEnabled: reminderSettings.contactReminderEnabled,
            contactReminderDays: reminderSettings.contactReminderDays,
          }}
        />
        <EmergencyContacts
          contacts={emergencyContacts.map((contact) => ({
            ...contact,
            id: contact.id.toString(),
            userId: contact.userId.toString(),
          }))}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
