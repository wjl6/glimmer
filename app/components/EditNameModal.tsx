// 编辑姓名弹窗组件
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface EditNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string | null;
  onNameUpdated?: (newName: string | null) => void;
}

export default function EditNameModal({
  isOpen,
  onClose,
  currentName,
  onNameUpdated,
}: EditNameModalProps) {
  const router = useRouter();
  const [name, setName] = useState(currentName || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 当弹窗打开时，重置表单
  useEffect(() => {
    if (isOpen) {
      setName(currentName || "");
      setError("");
    }
  }, [isOpen, currentName]);

  // ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 验证姓名长度
    if (name && name.trim().length > 50) {
      setError("姓名长度不能超过 50 个字符");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/name", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() || null }),
      });

      const data = await response.json();

      if (response.ok) {
        // 立即更新显示
        if (onNameUpdated) {
          onNameUpdated(data.user?.name || null);
        }
        // 刷新页面以更新服务端 session
        router.refresh();
        onClose();
      } else {
        setError(data?.error || "更新失败，请稍后重试");
      }
    } catch (error) {
      console.error("更新姓名错误:", error);
      setError("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200" />

      {/* 弹窗内容 */}
      <div
        className="relative z-10 w-full max-w-sm transform rounded-2xl border border-zinc-200 bg-white shadow-xl transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalSlideIn 0.2s ease-out",
        }}
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            修改姓名
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                姓名（可选）
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                autoFocus
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
                placeholder="你的名字"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                留空将显示为"朋友"
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="select-none rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="select-none rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                {isLoading ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
