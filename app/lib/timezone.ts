// 时区工具函数
// 统一使用 UTC 存储和比较时间，从根源杜绝时区错乱
// 数据库存储：UTC 时间戳（Date 对象内部就是 UTC 时间戳）
// 日期比较：统一使用 UTC 的 00:00:00
// 日期显示：转换为 Asia/Shanghai 时区显示给用户

const DISPLAY_TIMEZONE = 'Asia/Shanghai';

/**
 * 获取当前 UTC 时间
 */
export function getNowUTC(): Date {
  return new Date();
}

/**
 * 将日期标准化为 UTC 时区的 00:00:00
 * 用于统一日期比较，避免时区问题
 * 
 * @param date - 要标准化的日期
 * @returns 返回 UTC 时区该日期 00:00:00 的 Date 对象
 */
export function normalizeDateToUTC(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0,
    0,
    0,
    0
  ));
}

/**
 * 获取今天 UTC 时区的开始时间（00:00:00）
 * 用于数据库查询和日期比较
 * 
 * @returns 返回今天 UTC 00:00:00 的 Date 对象
 */
export function getTodayStartUTC(): Date {
  const now = new Date();
  return normalizeDateToUTC(now);
}

/**
 * 计算两个日期之间相差的天数（基于 UTC 时区）
 * 
 * @param date1 - 第一个日期
 * @param date2 - 第二个日期
 * @returns 相差的天数（date2 - date1）
 */
export function calculateDaysBetween(date1: Date, date2: Date): number {
  const normalized1 = normalizeDateToUTC(date1);
  const normalized2 = normalizeDateToUTC(date2);
  const diffMs = normalized2.getTime() - normalized1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 在指定日期基础上增加指定天数（基于 UTC 时区）
 * 
 * @param date - 基准日期
 * @param days - 要增加的天数（可以为负数）
 * @returns 增加天数后的日期
 */
export function addDaysUTC(date: Date, days: number): Date {
  const normalized = normalizeDateToUTC(date);
  const result = new Date(normalized);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * 获取指定日期在显示时区的日期字符串（YYYY-MM-DD）
 * 用于显示给用户
 * 
 * @param date - 要格式化的日期（UTC 时间）
 * @returns 在 Asia/Shanghai 时区的日期字符串
 */
export function getDateStringForDisplay(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: DISPLAY_TIMEZONE });
}

/**
 * 格式化日期用于显示（转换为 Asia/Shanghai 时区）
 * 
 * @param date - 要格式化的日期（UTC 时间）
 * @param options - Intl.DateTimeFormatOptions 选项
 * @returns 格式化后的日期字符串
 */
export function formatDateForDisplay(
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return date.toLocaleDateString('zh-CN', {
    timeZone: DISPLAY_TIMEZONE,
    ...options,
  });
}

/**
 * 格式化日期时间用于显示（转换为 Asia/Shanghai 时区）
 * 
 * @param date - 要格式化的日期时间（UTC 时间）
 * @param options - Intl.DateTimeFormatOptions 选项
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTimeForDisplay(
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return date.toLocaleString('zh-CN', {
    timeZone: DISPLAY_TIMEZONE,
    ...options,
  });
}
