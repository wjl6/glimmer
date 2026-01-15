// 提醒设置组件
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";

interface ReminderSettingsProps {
  settings: {
    id: string;
    enabled: boolean;
    selfReminderEnabled: boolean;
    selfReminderDays: number;
    contactReminderEnabled: boolean;
    contactReminderDays: number;
  };
}

export default function ReminderSettings({ settings }: ReminderSettingsProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [selfReminderEnabled, setSelfReminderEnabled] = useState(
    settings.selfReminderEnabled
  );
  const [selfReminderDays, setSelfReminderDays] = useState(settings.selfReminderDays.toString());
  const [contactReminderEnabled, setContactReminderEnabled] = useState(
    settings.contactReminderEnabled
  );
  const [contactReminderDays, setContactReminderDays] = useState(settings.contactReminderDays.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 成功弹窗自动关闭
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 验证并转换天数输入
      const selfDays = Math.max(1, Math.min(30, Number(selfReminderDays) || 3));
      const contactDays = Math.max(1, Math.min(30, Number(contactReminderDays) || 7));

      const response = await fetch("/api/settings/reminder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled,
          selfReminderEnabled,
          selfReminderDays: selfDays,
          contactReminderEnabled,
          contactReminderDays: contactDays,
        }),
      });

      if (response.ok) {
        setShowSuccessModal(true);
        router.refresh();
      }
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="设置已保存成功"
        type="success"
        confirmText="知道了"
      />
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
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  给自己发送提醒
                </label>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  不活跃时给自己发送邮件提醒
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

            {selfReminderEnabled && (
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  连续多少天未活跃后触发（自我提醒）
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={selfReminderDays}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 允许空值或有效的数字
                    if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                      setSelfReminderDays(value);
                    }
                  }}
                  onBlur={(e) => {
                    // 失去焦点时，如果为空或无效，恢复默认值
                    const numValue = Number(e.target.value);
                    if (isNaN(numValue) || numValue < 1) {
                      setSelfReminderDays("3");
                    } else if (numValue > 30) {
                      setSelfReminderDays("30");
                    } else {
                      setSelfReminderDays(numValue.toString());
                    }
                  }}
                  className="mt-2 w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 sm:max-w-none"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  通知紧急联系人
                </label>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  不活跃时通知紧急联系人
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

            {contactReminderEnabled && (
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  连续多少天未活跃后触发（联系人提醒）
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={contactReminderDays}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 允许空值或有效的数字
                    if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                      setContactReminderDays(value);
                    }
                  }}
                  onBlur={(e) => {
                    // 失去焦点时，如果为空或无效，恢复默认值
                    const numValue = Number(e.target.value);
                    if (isNaN(numValue) || numValue < 1) {
                      setContactReminderDays("7");
                    } else if (numValue > 30) {
                      setContactReminderDays("30");
                    } else {
                      setContactReminderDays(numValue.toString());
                    }
                  }}
                  className="mt-2 w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 sm:max-w-none"
                />
              </div>
            )}
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
    </>
  );
}
