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
              <a
                href="https://github.com/wjl6/glimmer"
                target="_blank"
                rel="noopener noreferrer"
                className="select-none p-2 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                aria-label="GitHub 开源项目"
                title="查看 GitHub 开源项目"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
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
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/wjl6/glimmer"
                target="_blank"
                rel="noopener noreferrer"
                className="select-none p-2 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                aria-label="GitHub 开源项目"
                title="查看 GitHub 开源项目"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
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
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
