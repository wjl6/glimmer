// 登录页面
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("test@email.com");
  const [password, setPassword] = useState("123456");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("reset") === "true") {
      setSuccessMessage("密码重置成功，请使用新密码登录");
      // 清除URL参数
      router.replace("/auth/signin");
    }
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("注册成功，请登录");
      // 清除URL参数
      router.replace("/auth/signin");
    }
  }, [searchParams, router]);

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/signin/google";
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signin-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert(data.error || "邮箱或密码错误");
      }
    } catch (error) {
      console.error("登录错误:", error);
      alert("登录失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-medium text-zinc-900 dark:text-zinc-50">
          欢迎回来
        </h1>
        {/*<p className="text-sm text-zinc-600 dark:text-zinc-400">*/}
        {/*  选择一种方式登录*/}
        {/*</p>*/}
      </div>

      <div className="space-y-4">
        {/*/!* 谷歌登录 *!/*/}
        {/*<button*/}
        {/*  onClick={handleGoogleSignIn}*/}
        {/*  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"*/}
        {/*>*/}
        {/*  使用 Google 登录*/}
        {/*</button>*/}

        {/*/!* 微信登录 *!/*/}
        {/*<button*/}
        {/*  onClick={() => {*/}
        {/*    // 微信登录逻辑待实现*/}
        {/*    alert("微信登录功能开发中");*/}
        {/*  }}*/}
        {/*  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"*/}
        {/*>*/}
        {/*  使用微信登录*/}
        {/*</button>*/}

        {/* 邮箱登录表单 */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-zinc-500 dark:bg-black dark:text-zinc-400">
              使用邮箱
            </span>
          </div>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          {successMessage && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
              {successMessage}
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
              placeholder="test@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
              placeholder="123456"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="select-none w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {isLoading ? "登录中..." : "登录"}
            </button>
          </div>
        </form>

        <div className="mt-4 text-right">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            忘记密码？
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            还没有账号？{" "}
            <Link
              href="/auth/register"
              className="font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
