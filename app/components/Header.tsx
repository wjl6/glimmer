// 极简的头部导航组件
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const response = await fetch("/api/auth/signout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      router.push("/auth/signin");
      router.refresh();
    }
  };

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-medium text-zinc-900 dark:text-zinc-50"
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
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                设置
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              登录
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
