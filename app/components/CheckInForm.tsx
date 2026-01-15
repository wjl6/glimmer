// 签到表单组件
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CheckInFormProps {
  hasCheckedIn: boolean;
  todayEncouragement?: string | null;
  todayEmoji?: string | null;
}

const emotions = [
  { emoji: "😊", label: "开心" },
  { emoji: "😌", label: "平静" },
  { emoji: "🌿", label: "放松" },
  { emoji: "🤔", label: "思考" },
  { emoji: "😴", label: "疲惫" },
  { emoji: "😣", label: "悲伤" },
];

interface SelectedEmotion {
  emoji: string;
  mood: string;
}

export default function CheckInForm({
  hasCheckedIn,
  todayEncouragement,
  todayEmoji,
}: CheckInFormProps) {
  const router = useRouter();
  const [selectedEmotion, setSelectedEmotion] = useState<SelectedEmotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emoji: selectedEmotion?.emoji || "🏃",
          mood: selectedEmotion?.mood || null,
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("签到失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasCheckedIn) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {todayEncouragement && todayEncouragement.trim().length > 0
            ? todayEncouragement
            : `今天已经签到过了 ${todayEmoji || "🏃"}`}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          选择今天的心情（可选，不选择将使用默认表情 🏃）
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {emotions.map((emotion) => (
            <button
              key={emotion.emoji}
              type="button"
              onClick={() => setSelectedEmotion({ emoji: emotion.emoji, mood: emotion.label })}
              className={`rounded-lg border p-4 text-center transition-colors ${
                selectedEmotion?.emoji === emotion.emoji
                  ? "border-zinc-900 bg-zinc-100 dark:border-zinc-50 dark:bg-zinc-800"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              }`}
            >
              <div className="mb-1 text-2xl">{emotion.emoji}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                {emotion.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        {isSubmitting ? "签到中..." : "签到"}
      </button>
    </form>
  );
}
