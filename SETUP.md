# 项目设置指南

## 1. 环境变量配置

创建 `.env` 文件（参考以下配置）：

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

## 2. 数据库设置

### 本地 PostgreSQL

1. 安装 PostgreSQL
2. 创建数据库：
   ```sql
   CREATE DATABASE glimmer;
   ```

### 使用云数据库（推荐）

- **Supabase**: https://supabase.com
- **Neon**: https://neon.tech
- **Railway**: https://railway.app

## 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev --name init
```

## 4. Google OAuth 设置

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID
5. 添加授权重定向 URI: `http://localhost:3000/api/auth/callback/google`
6. 复制客户端 ID 和密钥到 `.env`

## 5. 微信登录设置（待实现）

1. 注册微信开放平台账号
2. 创建网站应用
3. 配置授权回调域名
4. 获取 AppID 和 AppSecret

## 6. 邮件服务设置

### Gmail

1. 启用两步验证
2. 生成应用专用密码
3. 使用应用专用密码作为 `SMTP_PASSWORD`

### 其他 SMTP 服务

- SendGrid
- Mailgun
- AWS SES
- 阿里云邮件服务

## 7. 启动项目

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

## 8. 设置定时任务

### Vercel（推荐）

项目已包含 `vercel.json` 配置，部署到 Vercel 后会自动设置 Cron Jobs。

### 其他平台

使用外部 Cron 服务（如 cron-job.org）定期调用：

```
GET https://your-domain.com/api/cron/reminder
Authorization: Bearer YOUR_CRON_SECRET
```

建议每天执行一次，时间设置为早上 9 点。

## 9. 常见问题

### Prisma Client 生成失败

```bash
# 清除并重新生成
rm -rf node_modules/.prisma
pnpm prisma generate
```

### 数据库连接失败

检查：
1. PostgreSQL 服务是否运行
2. DATABASE_URL 是否正确
3. 数据库用户权限

### NextAuth.js 认证失败

检查：
1. AUTH_SECRET 是否设置
2. AUTH_URL 是否正确
3. OAuth 提供商配置是否正确
