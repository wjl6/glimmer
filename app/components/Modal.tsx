// 通用弹窗组件
"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "success" | "confirm";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = "success",
  confirmText = "确定",
  cancelText = "取消",
  onConfirm,
}: ModalProps) {
  useEffect(() => {
    // 只有确认弹窗才阻止滚动，成功弹窗不阻止
    if (isOpen && type === "confirm") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, type]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        type === "success" ? "pointer-events-none" : ""
      }`}
      onClick={type === "success" ? undefined : onClose}
    >
      {/* 背景遮罩 - 只有确认弹窗才显示 */}
      {type === "confirm" && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200" />
      )}

      {/* 弹窗内容 */}
      <div
        className={`relative z-10 transform rounded-2xl border border-zinc-200 bg-white shadow-xl transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900 ${
          type === "success" ? "w-auto max-w-xs pointer-events-auto" : "w-full max-w-sm"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalSlideIn 0.2s ease-out",
        }}
      >
        <div className={type === "success" ? "p-4" : "p-6"}>
          {type === "success" && (
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {type === "confirm" && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          )}

          {title && (
            <h3 className="mb-2 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </h3>
          )}

          <p className={`text-center text-zinc-600 dark:text-zinc-400 ${
            type === "success" ? "text-xs" : "text-sm"
          }`}>
            {message}
          </p>

          {type === "confirm" && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="select-none rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="select-none rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                {confirmText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
