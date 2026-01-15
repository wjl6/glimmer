-- 邮箱验证码表：存储注册时的邮箱验证码
CREATE TABLE "EmailVerificationCode" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailVerificationCode_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "EmailVerificationCode" IS '邮箱验证码表：存储注册时的邮箱验证码，用于验证邮箱所有权';
COMMENT ON COLUMN "EmailVerificationCode"."id" IS '验证码记录唯一标识符（自增BIGINT）';
COMMENT ON COLUMN "EmailVerificationCode"."email" IS '邮箱地址';
COMMENT ON COLUMN "EmailVerificationCode"."code" IS '6位数字验证码';
COMMENT ON COLUMN "EmailVerificationCode"."used" IS '是否已使用（使用后不能再用于验证）';
COMMENT ON COLUMN "EmailVerificationCode"."createdAt" IS '验证码创建时间';
COMMENT ON COLUMN "EmailVerificationCode"."expiresAt" IS '验证码过期时间（15分钟后）';

-- 创建复合索引：优化按邮箱和创建时间查询验证码的性能（用于60秒限制检查）
CREATE INDEX "EmailVerificationCode_email_createdAt_idx" ON "EmailVerificationCode"("email", "createdAt" DESC);

-- 创建复合索引：优化按邮箱和已使用状态查询有效验证码的性能
CREATE INDEX "EmailVerificationCode_email_used_idx" ON "EmailVerificationCode"("email", "used");
