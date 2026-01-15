-- 用户表：存储系统用户基本信息
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "User" IS '用户表：存储系统用户的基本信息';
COMMENT ON COLUMN "User"."id" IS '用户唯一标识符（自增BIGINT）';
COMMENT ON COLUMN "User"."email" IS '用户邮箱地址（可选，用于登录）';
COMMENT ON COLUMN "User"."emailVerified" IS '邮箱验证时间戳，NULL表示未验证';
COMMENT ON COLUMN "User"."name" IS '用户显示名称';
COMMENT ON COLUMN "User"."image" IS '用户头像URL';
COMMENT ON COLUMN "User"."password" IS '密码哈希值（使用bcrypt加密，仅邮箱登录用户有此字段，OAuth用户为NULL）';
COMMENT ON COLUMN "User"."createdAt" IS '账户创建时间';
COMMENT ON COLUMN "User"."updatedAt" IS '账户最后更新时间';

-- OAuth账户表：存储第三方登录账户信息
CREATE TABLE "Account" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "Account" IS 'OAuth账户表：存储用户通过第三方平台（如Google、微信）登录的账户信息';
COMMENT ON COLUMN "Account"."id" IS '账户唯一标识符（自增BIGINT）';
COMMENT ON COLUMN "Account"."userId" IS '关联的用户ID，外键引用User表（BIGINT）';
COMMENT ON COLUMN "Account"."type" IS '账户类型（如oauth、credentials等）';
COMMENT ON COLUMN "Account"."provider" IS '第三方登录提供商（如google、wechat等）';
COMMENT ON COLUMN "Account"."providerAccountId" IS '第三方平台中的账户ID';
COMMENT ON COLUMN "Account"."refresh_token" IS 'OAuth刷新令牌，用于获取新的访问令牌';
COMMENT ON COLUMN "Account"."access_token" IS 'OAuth访问令牌';
COMMENT ON COLUMN "Account"."expires_at" IS '访问令牌过期时间（Unix时间戳）';
COMMENT ON COLUMN "Account"."token_type" IS '令牌类型（如Bearer）';
COMMENT ON COLUMN "Account"."scope" IS 'OAuth授权范围';
COMMENT ON COLUMN "Account"."id_token" IS 'OpenID Connect ID令牌';
COMMENT ON COLUMN "Account"."session_state" IS 'OAuth会话状态';

-- 会话表：存储用户登录会话信息
CREATE TABLE "Session" (
    "id" BIGSERIAL NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "Session" IS '会话表：存储用户登录会话信息，用于维护用户登录状态';
COMMENT ON COLUMN "Session"."id" IS '会话唯一标识符（自增BIGINT）';
COMMENT ON COLUMN "Session"."sessionToken" IS '会话令牌，用于验证用户身份';
COMMENT ON COLUMN "Session"."userId" IS '关联的用户ID，外键引用User表（BIGINT）';
COMMENT ON COLUMN "Session"."expires" IS '会话过期时间';

-- 验证令牌表：存储邮箱验证等临时令牌
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

COMMENT ON TABLE "VerificationToken" IS '验证令牌表：存储邮箱验证、密码重置等临时验证令牌';
COMMENT ON COLUMN "VerificationToken"."identifier" IS '令牌标识符（通常是邮箱地址）';
COMMENT ON COLUMN "VerificationToken"."token" IS '验证令牌值';
COMMENT ON COLUMN "VerificationToken"."expires" IS '令牌过期时间';

-- 签到记录表：存储用户每日签到记录
CREATE TABLE "CheckIn" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "mood" TEXT,
    "emoji" TEXT NOT NULL DEFAULT '🏃',
    "encouragement" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "CheckIn" IS '签到记录表：存储用户每日签到记录，每个用户每天只能签到一次';
COMMENT ON COLUMN "CheckIn"."id" IS '签到记录唯一标识符（自增BIGINT）';
COMMENT ON COLUMN "CheckIn"."userId" IS '关联的用户ID，外键引用User表（BIGINT）';
COMMENT ON COLUMN "CheckIn"."mood" IS '用户签到时的心情（可选，如：开心、平静、疲惫等）';
COMMENT ON COLUMN "CheckIn"."emoji" IS '用户签到时选择的表情符号（默认：🏃）';
COMMENT ON COLUMN "CheckIn"."encouragement" IS '为特定心情自动生成的一句简短鼓励话语';
COMMENT ON COLUMN "CheckIn"."date" IS '签到日期时间戳（通常只使用日期部分，时间部分会被设置为00:00:00）';
COMMENT ON COLUMN "CheckIn"."createdAt" IS '签到记录创建时间戳';

-- 提醒设置表：存储用户的失联提醒配置
CREATE TABLE "ReminderSettings" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "inactivityDays" INTEGER NOT NULL DEFAULT 7,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "selfReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "contactReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderSettings_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "ReminderSettings" IS '提醒设置表：存储用户的失联检测和提醒配置，每个用户只有一条记录';
COMMENT ON COLUMN "ReminderSettings"."id" IS '设置记录唯一标识符（自增BIGINT）';
COMMENT ON COLUMN "ReminderSettings"."userId" IS '关联的用户ID，外键引用User表，唯一约束（BIGINT）';
COMMENT ON COLUMN "ReminderSettings"."inactivityDays" IS '失联检测天数阈值，超过此天数未签到将触发提醒（默认7天）';
COMMENT ON COLUMN "ReminderSettings"."enabled" IS '是否启用失联提醒功能';
COMMENT ON COLUMN "ReminderSettings"."selfReminderEnabled" IS '是否启用向自己发送提醒邮件';
COMMENT ON COLUMN "ReminderSettings"."contactReminderEnabled" IS '是否启用向紧急联系人发送提醒邮件';
COMMENT ON COLUMN "ReminderSettings"."createdAt" IS '设置创建时间';
COMMENT ON COLUMN "ReminderSettings"."updatedAt" IS '设置最后更新时间';

-- 紧急联系人表：存储用户的紧急联系人信息
CREATE TABLE "EmergencyContact" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "EmergencyContact" IS '紧急联系人表：存储用户的紧急联系人信息，用于失联时发送提醒邮件';
COMMENT ON COLUMN "EmergencyContact"."id" IS '联系人唯一标识符（自增BIGINT）';
COMMENT ON COLUMN "EmergencyContact"."userId" IS '关联的用户ID，外键引用User表（BIGINT）';
COMMENT ON COLUMN "EmergencyContact"."name" IS '联系人姓名';
COMMENT ON COLUMN "EmergencyContact"."email" IS '联系人邮箱地址，用于接收失联提醒';
COMMENT ON COLUMN "EmergencyContact"."enabled" IS '是否启用此联系人（禁用后不会收到提醒）';
COMMENT ON COLUMN "EmergencyContact"."createdAt" IS '联系人添加时间';
COMMENT ON COLUMN "EmergencyContact"."updatedAt" IS '联系人信息最后更新时间';

-- 通知日志表：存储系统发送的通知记录
CREATE TABLE "NotificationLog" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "content" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "NotificationLog" IS '通知日志表：记录系统发送的所有通知（邮件、短信等），用于追踪和调试';
COMMENT ON COLUMN "NotificationLog"."id" IS '日志记录唯一标识符（自增BIGINT）';
COMMENT ON COLUMN "NotificationLog"."userId" IS '关联的用户ID，外键引用User表（BIGINT）';
COMMENT ON COLUMN "NotificationLog"."type" IS '通知类型（如：self_reminder、contact_reminder等）';
COMMENT ON COLUMN "NotificationLog"."status" IS '通知状态（pending：待发送，sent：已发送，failed：发送失败）';
COMMENT ON COLUMN "NotificationLog"."content" IS '通知内容（可选，用于存储邮件内容摘要等）';
COMMENT ON COLUMN "NotificationLog"."error" IS '错误信息（如果发送失败，记录错误详情）';
COMMENT ON COLUMN "NotificationLog"."createdAt" IS '日志记录创建时间';

-- 创建唯一索引：用户邮箱唯一性约束
CREATE UNIQUE INDEX "User_email_key" ON "User"("email") WHERE "email" IS NOT NULL;

-- 创建唯一索引：同一第三方平台的账户ID唯一性约束
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- 创建唯一索引：会话令牌唯一性约束
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- 创建唯一索引：验证令牌唯一性约束
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- 创建唯一索引：标识符和令牌组合唯一性约束
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- 创建复合索引：优化按用户和日期查询签到记录的性能
CREATE INDEX "CheckIn_userId_date_idx" ON "CheckIn"("userId", "date" DESC);

-- 创建唯一索引：确保每个用户每天只能签到一次
CREATE UNIQUE INDEX "CheckIn_userId_date_key" ON "CheckIn"("userId", "date");

-- 创建唯一索引：确保每个用户只有一条提醒设置记录
CREATE UNIQUE INDEX "ReminderSettings_userId_key" ON "ReminderSettings"("userId");

-- 创建索引：优化按用户查询紧急联系人的性能
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- 创建复合索引：优化按用户和时间范围查询通知日志的性能
CREATE INDEX "NotificationLog_userId_createdAt_idx" ON "NotificationLog"("userId", "createdAt" DESC);

-- 添加外键约束：Account表关联User表，级联删除
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键约束：Session表关联User表，级联删除
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键约束：CheckIn表关联User表，级联删除
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键约束：ReminderSettings表关联User表，级联删除
ALTER TABLE "ReminderSettings" ADD CONSTRAINT "ReminderSettings_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键约束：EmergencyContact表关联User表，级联删除
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键约束：NotificationLog表关联User表，级联删除
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加数据完整性约束：确保失联检测天数大于0
ALTER TABLE "ReminderSettings" ADD CONSTRAINT "ReminderSettings_inactivityDays_check" 
    CHECK ("inactivityDays" > 0);

-- 添加数据完整性约束：确保通知状态为有效值
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_status_check" 
    CHECK ("status" IN ('pending', 'sent', 'failed'));

-- 添加数据完整性约束：确保邮箱格式基本正确（包含@符号）
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_email_check" 
    CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 插入默认邮箱用户（id使用DEFAULT让数据库自动生成）
INSERT INTO "User" ("email", "name", "password", "emailVerified", "createdAt", "updatedAt")
VALUES (
    'test@email.com',
    '柒',
    '$2b$10$Whd2iLYAMlul6SJcm8JBR.96p6veXAlQkzpE5BsG/HDnuGET97Oo2',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
