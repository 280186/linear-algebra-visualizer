/**
 * Animation - 动画接口
 *
 * 所有动画必须实现此接口。
 * t 的范围是 [0, 1]，由 Timeline 负责推进。
 */
export interface Animation {
  /** 动画时长（毫秒） */
  duration: number;

  /** 动画开始时调用 */
  start(): void;

  /**
   * 动画更新
   * @param t 进度 [0, 1]，已应用缓动函数
   */
  update(t: number): void;

  /** 动画结束时调用 */
  finish(): void;
}
