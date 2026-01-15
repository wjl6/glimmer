// 提醒设置组件
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReminderSettingsProps {
  settings: {
    id: string;
    inactivityDays: number;
    enabled: boolean;
    selfReminderEnabled: boolean;
    contactReminderEnabled: boolean;
  };
}

export default function ReminderSettings({ settings }: ReminderSettingsProps) {
  const router = useRouter();
  const [inactivityDays, setInactivityDays] = useState(settings.inactivityDays);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [selfReminderEnabled, setSelfReminderEnabled] = useState(
    settings.selfReminderEnabled
  );
  const [contactReminderEnabled, setContactReminderEnabled] = useState(
    settings.contactReminderEnabled
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings/reminder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inactivityDays,
          enabled,
          selfReminderEnabled,
          contactReminderEnabled,
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
        提醒设置
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              启用提醒
            </label>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              关闭后将不再发送任何提醒
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled
                ? "bg-white dark:bg-white"
                : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                enabled
                  ? "translate-x-6 bg-zinc-900 dark:bg-zinc-950"
                  : "translate-x-1 bg-white dark:bg-zinc-950"
              }`}
            />
          </button>
        </div>

        {enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                失联检测天数
              </label>
              <p className="mt-1 mb-2 text-xs text-zinc-600 dark:text-zinc-400">
                连续多少天未签到后触发提醒
              </p>
              <input
                type="number"
                min="1"
                max="30"
                value={inactivityDays}
                onChange={(e) => setInactivityDays(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  给自己发送提醒
                </label>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  失联时给自己发送邮件提醒
                </p>
              </div>
              <button
                onClick={() => setSelfReminderEnabled(!selfReminderEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  selfReminderEnabled
                    ? "bg-white dark:bg-white"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                    selfReminderEnabled
                      ? "translate-x-6 bg-zinc-900 dark:bg-zinc-950"
                      : "translate-x-1 bg-white dark:bg-zinc-950"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  通知紧急联系人
                </label>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  失联时通知紧急联系人
                </p>
              </div>
              <button
                onClick={() =>
                  setContactReminderEnabled(!contactReminderEnabled)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  contactReminderEnabled
                    ? "bg-white dark:bg-white"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                    contactReminderEnabled
                      ? "translate-x-6 bg-zinc-900 dark:bg-zinc-950"
                      : "translate-x-1 bg-white dark:bg-zinc-950"
                  }`}
                />
              </button>
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {isSaving ? "保存中..." : "保存设置"}
        </button>
      </div>
    </div>
  );
}
