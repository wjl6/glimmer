// 紧急联系人 API
import { auth } from "@/app/auth";
import { db } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { name, email } = await request.json();

    // 检查是否已有3个联系人
    const existingContactsCount = await db.emergencyContact.count({
      where: { userId: BigInt(session.user.id) },
    });

    if (existingContactsCount >= 3) {
      return NextResponse.json(
        { error: "最多只能添加3个紧急联系人" },
        { status: 400 }
      );
    }

    const contact = await db.emergencyContact.create({
      data: {
        userId: BigInt(session.user.id),
        name,
        email,
      },
    });

    return NextResponse.json({
      success: true,
      contact: {
        ...contact,
        id: contact.id.toString(),
        userId: contact.userId.toString(),
      },
    });
  } catch (error) {
    console.error("添加联系人失败:", error);
    return NextResponse.json(
      { error: "添加失败，请稍后重试" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id, enabled } = await request.json();

    const contactId = BigInt(id);

    const contact = await db.emergencyContact.findFirst({
      where: { id: contactId, userId: BigInt(session.user.id) },
    });

    if (!contact) {
      return NextResponse.json({ error: "联系人不存在" }, { status: 404 });
    }

    const updated = await db.emergencyContact.update({
      where: { id: contactId },
      data: { enabled: Boolean(enabled) },
    });

    return NextResponse.json({
      success: true,
      contact: {
        ...updated,
        id: updated.id.toString(),
        userId: updated.userId.toString(),
      },
    });
  } catch (error) {
    console.error("更新联系人失败:", error);
    return NextResponse.json(
      { error: "更新失败，请稍后重试" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await request.json();

    const contactId = BigInt(id);

    const contact = await db.emergencyContact.findFirst({
      where: { id: contactId, userId: BigInt(session.user.id) },
    });

    if (!contact) {
      return NextResponse.json({ error: "联系人不存在" }, { status: 404 });
    }

    await db.emergencyContact.delete({
      where: { id: contactId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除联系人失败:", error);
    return NextResponse.json(
      { error: "删除失败，请稍后重试" },
      { status: 500 }
    );
  }
}
