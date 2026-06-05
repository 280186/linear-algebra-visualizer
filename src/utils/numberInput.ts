/**
 * 数值解析工具
 * 支持整数、小数、负数、简单分数 a/b
 */

// 合法数字正则：整数、小数、分数
// 支持：3, -3, 0.5, -0.5, .5, 3/7, -3/7, 3/-7, -3/-7
const NUMBER_REGEX = /^-?(\d+\.?\d*|\.\d+)(\/-?(\d+\.?\d*|\.\d+))?$/;

/**
 * 解析数字输入
 */
export function parseNumberInput(raw: string): { ok: true; value: number } | { ok: false; reason: string } {
  const trimmed = raw.trim();

  if (trimmed === '') {
    return { ok: false, reason: '空字符串' };
  }

  // 正则匹配
  if (!NUMBER_REGEX.test(trimmed)) {
    return { ok: false, reason: '非法数字格式' };
  }

  // 检查是否是分数
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length !== 2) {
      return { ok: false, reason: '无效分数格式' };
    }

    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]);

    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
      return { ok: false, reason: '无效数字' };
    }

    if (denominator === 0) {
      return { ok: false, reason: '分母不能为 0' };
    }

    const result = numerator / denominator;
    if (!Number.isFinite(result)) {
      return { ok: false, reason: '结果不是有限数' };
    }

    return { ok: true, value: result };
  }

  // 普通数字
  const value = parseFloat(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, reason: '无效数字' };
  }

  return { ok: true, value };
}

/**
 * 格式化数字为字符串
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  if (Number.isInteger(value)) {
    return value.toString();
  }
  // 保留 2 位小数，去除尾部 0
  return parseFloat(value.toFixed(2)).toString();
}
