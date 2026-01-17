// 极简的头部导航组件
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [csrfToken, setCsrfToken] = useState<string>("");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    // 直接检查 HTML 元素是否有 dark 类，这是最可靠的方法
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  };

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
    
    // 清除所有可能的本地存储，但保留主题偏好
    if (typeof window !== "undefined") {
      // 保存当前主题偏好（next-themes 使用 "theme" 作为 key）
      const currentTheme = localStorage.getItem("theme");
      
      // 清除所有本地存储
      localStorage.clear();
      sessionStorage.clear();
      
      // 恢复主题偏好，避免退出后主题自动切换
      if (currentTheme) {
        localStorage.setItem("theme", currentTheme);
      }
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
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="select-none p-2 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  aria-label="切换主题"
                  title={resolvedTheme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
                >
                  {resolvedTheme === "dark" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
              )}
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
            mounted && (
              <button
                onClick={toggleTheme}
                className="select-none p-2 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                aria-label="切换主题"
                title={resolvedTheme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
              >
                {resolvedTheme === "dark" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            )
          )}
        </div>
      </nav>
    </header>
  );
}
