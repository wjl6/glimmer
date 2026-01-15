// 紧急联系人组件
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Contact {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
}

interface EmergencyContactsProps {
  contacts: Contact[];
  userId: string;
}

export default function EmergencyContacts({
  contacts,
  userId,
}: EmergencyContactsProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      if (response.ok) {
        setName("");
        setEmail("");
        router.refresh();
      }
    } catch (error) {
      console.error("添加失败:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (contactId: string, enabled: boolean) => {
    try {
      await fetch("/api/contacts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: contactId, enabled: !enabled }),
      });
      router.refresh();
    } catch (error) {
      console.error("更新失败:", error);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("确定要删除这个联系人吗？")) return;

    try {
      await fetch("/api/contacts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: contactId }),
      });
      router.refresh();
    } catch (error) {
      console.error("删除失败:", error);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
        紧急联系人
      </h2>

      <div className="space-y-4">
        {contacts.length > 0 ? (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {contact.name}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  {contact.email}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(contact.id, contact.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    contact.enabled
                      ? "bg-white dark:bg-white"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                      contact.enabled
                        ? "translate-x-6 bg-zinc-900 dark:bg-zinc-950"
                        : "translate-x-1 bg-white dark:bg-zinc-950"
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  删除
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            还没有添加紧急联系人
          </p>
        )}

        <form onSubmit={handleAdd} className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="姓名"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
            />
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
            />
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            {isAdding ? "添加中..." : "添加联系人"}
          </button>
        </form>
      </div>
    </div>
  );
}
