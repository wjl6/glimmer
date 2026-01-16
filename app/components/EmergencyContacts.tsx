// 紧急联系人组件
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 前端检查是否已有3个联系人
    if (contacts.length >= 3) {
      setError("最多只能添加3个紧急联系人");
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setName("");
        setEmail("");
        router.refresh();
      } else {
        setError(data?.error || "添加失败，请稍后重试");
      }
    } catch (error) {
      console.error("添加失败:", error);
      setError("添加失败，请稍后重试");
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

  const handleDeleteClick = (contactId: string) => {
    setContactToDelete(contactId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;

    try {
      await fetch("/api/contacts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: contactToDelete }),
      });
      router.refresh();
      setShowDeleteModal(false);
      setContactToDelete(null);
    } catch (error) {
      console.error("删除失败:", error);
    }
  };

  return (
    <>
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setContactToDelete(null);
        }}
        title="确认删除"
        message="确定要删除这个联系人吗？删除后无法恢复。"
        type="confirm"
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleDeleteConfirm}
      />
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          紧急联系人
        </h2>

      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
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
                  className={`select-none relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
                  onClick={() => handleDeleteClick(contact.id)}
                  className="select-none text-sm text-red-600 hover:text-red-700 dark:text-red-400"
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

        {contacts.length < 3 ? (
          <form onSubmit={handleAdd} className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="姓名"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              />
            </div>
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="邮箱"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="select-none w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {isAdding ? "添加中..." : "添加联系人"}
            </button>
          </form>
        ) : (
          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              已达到最大数量（3个），如需添加新联系人，请先删除现有联系人
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
