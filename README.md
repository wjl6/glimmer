# 微光 (Glimmer)

极简的每日签到和失联提醒工具。

## 项目简介

微光是一个极简主义的每日签到和失联提醒工具。它设计得安静且不打扰，只在用户失联时才会提醒。目前正在开发阶段，核心特性将逐步完善
## 核心特性

- ✅ 每日签到（每天一次）
- ✅ 可选的心情选择（简单、非量化）
- ✅ 偏消极心情时AI话语鼓励
- ✅ 基于可配置天数的失联检测
- ✅ 多级提醒策略（自己 → 紧急联系人）
- ✅ 邮件通知
- ✅ 邮箱登录（注册、登录、密码重置）
- ⚠️ Google OAuth 登录（已配置，待测试）
- ❌ 微信登录（待实现）

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **数据库**: PostgreSQL + Prisma
- **认证**: NextAuth.js v5
- **样式**: Tailwind CSS 4
- **邮件**: Nodemailer

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写以下配置：

```env
# 数据库连接（PostgreSQL）
DATABASE_URL="postgresql://user:password@localhost:5432/glimmer?schema=public"

# NextAuth.js 配置
# 生成 AUTH_SECRET: openssl rand -base64 32
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"

# 邮件服务配置（SMTP）
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="Glimmer <noreply@glimmer.app>"

# Google OAuth 配置
# 获取方式: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 微信登录配置（需要微信开放平台账号）
WECHAT_CLIENT_ID="your-wechat-app-id"
WECHAT_CLIENT_SECRET="your-wechat-app-secret"

# Cron 任务密钥（可选，用于保护定时任务 API）
CRON_SECRET="your-random-secret-key"

# LLM / LangChain 配置
# 模型提供方，例如: openai
LLM_PROVIDER="openai"
# 大模型 API Key，例如: OpenAI API Key
LLM_API_KEY="your-llm-api-key"
# 使用的大模型名称，例如: gpt-4.1-mini
LLM_MODEL="gpt-4.1-mini"
# 可选：自定义大模型请求 Base URL（例如自建代理网关）
# 默认使用官方地址，如需走代理或私有网关时再配置
LLM_BASE_URL="https://your-llm-gateway.example.com/v1"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 设置定时任务

失联检测和提醒功能需要通过定时任务定期执行。你可以：

1. **使用 Vercel Cron Jobs**（如果部署在 Vercel）：
   ```json
   {
     "crons": [{
       "path": "/api/cron/reminder",
       "schedule": "0 9 * * *"
     }]
   }
   ```

2. **使用外部 Cron 服务**（如 cron-job.org）：
   - URL: `https://your-domain.com/api/cron/reminder`
   - 方法: GET
   - 请求头: `Authorization: Bearer YOUR_CRON_SECRET`
   - 频率: 每天一次（建议早上 9 点）

3. **本地测试**：
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/reminder
   ```

## 项目结构

```
app/
├── api/              # API 路由
│   ├── auth/         # NextAuth.js 认证
│   │   ├── [...nextauth]/  # NextAuth 路由
│   │   ├── register/       # 注册 API
│   │   ├── reset-password/ # 密码重置 API
│   │   ├── send-reset-code/ # 发送重置码 API
│   │   ├── send-verification-code/ # 发送验证码 API
│   │   └── signin-credentials/ # 邮箱登录 API
│   ├── checkin/      # 签到 API
│   ├── contacts/     # 紧急联系人 API
│   ├── cron/         # 定时任务 API
│   └── settings/     # 设置 API
├── auth/             # 认证页面
│   ├── signin/       # 登录页面
│   ├── register/     # 注册页面
│   └── forgot-password/ # 忘记密码页面
├── components/       # React 组件
│   ├── CheckInForm.tsx
│   ├── EmergencyContacts.tsx
│   ├── Header.tsx
│   ├── Modal.tsx
│   ├── providers.tsx
│   └── ReminderSettings.tsx
├── lib/              # 工具函数
│   ├── auth.ts       # NextAuth 配置
│   ├── db.ts         # 数据库客户端
│   ├── email.ts      # 邮件服务
│   ├── encouragementAgent.ts # AI 鼓励生成
│   ├── reminder.ts   # 提醒逻辑
│   └── timezone.ts   # 时区处理
├── settings/         # 设置页面
├── layout.tsx        # 根布局
└── page.tsx          # 首页

prisma/
├── schema.prisma     # 数据库模型定义
└── migrations/       # 数据库迁移文件

types/
└── next-auth.d.ts    # NextAuth 类型扩展

generated/
└── prisma/           # Prisma 生成的客户端（自动生成）
```

## 开发指南

### 添加新的登录方式

在 `app/lib/auth.ts` 中添加新的 provider：

```typescript
import WeChat from "next-auth/providers/wechat"; // 需要自定义 provider

providers: [
  WeChat({
    clientId: process.env.WECHAT_CLIENT_ID,
    clientSecret: process.env.WECHAT_CLIENT_SECRET,
  }),
]
```

### 自定义邮件模板

修改 `app/lib/reminder.ts` 中的邮件内容，保持温和、非指令性的语调。

## 部署

### Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 设置 Cron Jobs（在 `vercel.json` 中）

### 其他平台

确保：
- 设置了所有必需的环境变量
- 数据库连接正常
- 配置了定时任务来调用 `/api/cron/reminder`

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
