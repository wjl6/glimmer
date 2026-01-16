// 可编辑姓名组件
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EditNameModal from "./EditNameModal";

interface EditableNameProps {
  name: string | null;
}

export default function EditableName({ name: initialName }: EditableNameProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState(initialName);

  // 当 prop 变化时更新本地状态（页面刷新后）
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const displayName = name || "朋友";

  const handleNameUpdated = (newName: string | null) => {
    // 立即更新本地状态
    setName(newName);
    // 刷新页面以更新服务端数据
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer rounded px-1 py-0.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        title="点击修改姓名"
      >
        {displayName}
      </button>
      <EditNameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentName={name}
        onNameUpdated={handleNameUpdated}
      />
    </>
  );
}
