import { Mat2 } from '../math/Mat2';
import { Animation } from './Animation';
import { smoothStep } from './easing';

/**
 * ApplyMatrixAnimation - 矩阵变换动画
 *
 * 让场景从起始矩阵 from 平滑变换到目标矩阵 to。
 * 不直接操作 Canvas，通过 onUpdate 回调传递当前矩阵。
 */
export class ApplyMatrixAnimation implements Animation {
  /** 动画时长（毫秒） */
  public duration: number;

  /** 起始矩阵 */
  private from: Mat2;
  /** 目标矩阵 */
  private to: Mat2;
  /** 缓动函数 */
  private easing: (t: number) => number;
  /** 更新回调 */
  private onUpdate: (current: Mat2) => void;
  /** 结束回调 */
  private onFinish?: () => void;

  constructor(options: {
    from: Mat2;
    to: Mat2;
    duration: number;
    easing?: (t: number) => number;
    onUpdate: (current: Mat2) => void;
    onFinish?: () => void;
  }) {
    this.from = options.from;
    this.to = options.to;
    this.duration = options.duration;
    this.easing = options.easing || smoothStep;
    this.onUpdate = options.onUpdate;
    this.onFinish = options.onFinish;
  }

  /** 动画开始 */
  start(): void {
    // 立即更新一次，显示起始状态
    this.onUpdate(this.from);
  }

  /**
   * 动画更新
   * @param t 原始进度 [0, 1]
   */
  update(t: number): void {
    // 应用缓动函数
    const eased = this.easing(t);
    // 线性插值
    const current = this.from.lerp(this.to, eased);
    this.onUpdate(current);
  }

  /** 动画结束 */
  finish(): void {
    // 确保最终状态精确
    this.onUpdate(this.to);
    if (this.onFinish) {
      this.onFinish();
    }
  }
}
