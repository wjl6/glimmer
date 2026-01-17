// NextAuth.js 配置
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/app/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "邮箱登录",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // 从数据库获取最新的用户信息，确保姓名更新后能立即反映
        if (token.id) {
          try {
            const dbUser = await db.user.findUnique({
              where: { id: BigInt(token.id as string) },
              select: { name: true, email: true, image: true },
            });
            if (dbUser) {
              // 使用类型断言，因为我们已经在类型定义中扩展了 Session 类型
              const user = session.user as {
                id: string;
                email?: string | null;
                name?: string | null;
                image?: string | null;
              };
              user.name = dbUser.name ?? null;
              user.email = dbUser.email ?? null;
              user.image = dbUser.image ?? null;
            } else {
              // 如果数据库中没有找到用户，使用 token 中的值
              const user = session.user as {
                id: string;
                email?: string | null;
                name?: string | null;
                image?: string | null;
              };
              user.name = token.name as string | null;
              user.email = token.email as string | null;
              user.image = token.image as string | null;
            }
          } catch (error) {
            // 如果数据库查询失败，使用 token 中的值
            const user = session.user as {
              id: string;
              email?: string | null;
              name?: string | null;
              image?: string | null;
            };
            user.name = token.name as string | null;
            user.email = token.email as string | null;
            user.image = token.image as string | null;
          }
        } else {
          const user = session.user as {
            id: string;
            email?: string | null;
            name?: string | null;
            image?: string | null;
          };
          user.name = token.name as string | null;
          user.email = token.email as string | null;
          user.image = token.image as string | null;
        }
      }
      return session;
    },
  },
});
