// 极简的头部导航组件
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [csrfToken, setCsrfToken] = useState<string>("");

  useEffect(() => {
    // 获取 CSRF token
    fetch("/api/auth/csrf", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
        }
      })
      .catch((error) => {
        console.error("获取 CSRF token 失败:", error);
      });
  }, []);

  const handleSignOut = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 清除所有可能的本地存储
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // 提交表单（会自动包含 CSRF token）
    const form = e.currentTarget as HTMLFormElement;
    form.submit();
  };

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="select-none flex items-center gap-2 text-lg font-medium text-zinc-900 dark:text-zinc-50"
          >
            <img
              src="/img/微光.ico"
              alt="微光"
              className="h-8 w-8 rounded-full object-cover"
            />
            <span>微光</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="select-none text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                设置
              </Link>
              <form method="POST" action="/api/auth/signout" onSubmit={handleSignOut}>
                <input type="hidden" name="csrfToken" value={csrfToken} />
                <input type="hidden" name="callbackUrl" value="/auth/signin" />
                <button
                  type="submit"
                  className="select-none text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  退出
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="select-none text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              登录
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
