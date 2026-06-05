/**
 * easing.ts - 缓动函数
 *
 * 所有函数输入 t 范围 [0, 1]，输出也在 [0, 1]。
 */

/** 线性缓动 */
export function linear(t: number): number {
  return t;
}

/** 平滑步进 */
export function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** 缓入缓出三次方 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
