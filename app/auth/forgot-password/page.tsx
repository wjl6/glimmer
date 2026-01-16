// 忘记密码页面
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  // 发送验证码
  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      setError("请先输入有效的邮箱地址");
      return;
    }

    setError("");
    setIsSendingCode(true);

    try {
      const response = await fetch("/api/auth/send-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data?.error || "发送验证码失败");
      }
    } catch (error) {
      console.error("发送验证码错误:", error);
      setError("发送验证码失败，请稍后重试");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 验证密码是否一致
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致，请重新输入");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, confirmPassword, verificationCode }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error("响应解析失败:", text);
        setError(`重置密码失败: ${response.status} ${response.statusText}`);
        return;
      }

      if (response.ok) {
        router.push("/auth/signin?reset=true");
      } else {
        const errorMsg = data?.error || `重置密码失败 (${response.status})`;
        console.error("重置密码失败:", errorMsg, data);
        setError(errorMsg);
      }
    } catch (error) {
      console.error("重置密码错误:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setError("网络错误，请检查网络连接");
      } else {
        setError(error instanceof Error ? error.message : "重置密码失败，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-medium text-zinc-900 dark:text-zinc-50">
          重置密码
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          通过邮箱验证码重置密码
        </p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            邮箱
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
              placeholder="your@email.com"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSendingCode || countdown > 0 || !email}
              className="select-none rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              {countdown > 0
                ? `${countdown}秒`
                : isSendingCode
                ? "发送中..."
                : "发送验证码"}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="verificationCode"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            验证码
          </label>
          <input
            id="verificationCode"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
            maxLength={6}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
            placeholder="请输入6位验证码"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            新密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
            placeholder="至少 6 位"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            确认新密码
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
            placeholder="请再次输入密码"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="select-none w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {isLoading ? "重置中..." : "重置密码"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          想起密码了？{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
          >
            返回登录
          </Link>
        </p>
      </div>
    </div>
  );
}
