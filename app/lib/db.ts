// 数据库客户端
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL 环境变量未设置");
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    
    const adapter = new PrismaPg(pool);
    
    const options: any = {
      adapter,
    };
    
    if (process.env.NODE_ENV === "development") {
      options.log = ["error", "warn"];
    } else {
      options.log = ["error"];
    }

    return new PrismaClient(options);
  } catch (error) {
    console.error("创建 Prisma Client 失败:", error);
    throw error;
  }
};

export const db =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
