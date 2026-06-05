import { Animation } from './Animation';

/**
 * Timeline - 动画调度器
 *
 * 职责：
 * 1. 管理当前动画
 * 2. 推进动画进度
 * 3. 支持暂停/继续
 * 4. 支持顺序播放多个动画（enqueue）
 * 5. 集中管理播放状态
 */
export class Timeline {
  /** 当前动画 */
  private currentAnimation: Animation | null = null;
  /** 等待队列 */
  private queue: Animation[] = [];
  /** 当前动画进度 [0, 1] */
  private progress: number = 0;
  /** 上一帧时间戳 */
  private lastTimestamp: number | null = null;
  /** 是否正在播放 */
  private playing: boolean = false;
  /** 是否暂停 */
  private paused: boolean = false;

  /** 播放状态变化回调 */
  private onStateChange?: (isPlaying: boolean) => void;
  /** 动画队列全部完成回调 */
  private onComplete?: () => void;

  /**
   * 设置回调
   */
  setCallbacks(
    onStateChange?: (isPlaying: boolean) => void,
    onComplete?: () => void
  ): void {
    this.onStateChange = onStateChange;
    this.onComplete = onComplete;
  }

  /**
   * 立即播放动画
   * 如果当前已有动画，中断并清空队列
   */
  play(animation: Animation): void {
    // 中断当前动画
    if (this.currentAnimation) {
      this.currentAnimation.finish();
    }

    // 清空队列
    this.queue = [];

    // 设置新动画
    this.currentAnimation = animation;
    this.progress = 0;
    this.lastTimestamp = null;
    this.playing = true;
    this.paused = false;

    // 通知状态变化
    this.onStateChange?.(true);

    // 调用 start
    animation.start();
  }

  /**
   * 将动画加入队列
   * 等待当前动画结束后顺序播放
   */
  enqueue(animation: Animation): void {
    if (!this.currentAnimation && !this.playing) {
      // 没有正在播放的动画，直接播放
      this.play(animation);
    } else {
      // 加入队列
      this.queue.push(animation);
    }
  }

  /**
   * 更新动画进度
   * @param timestamp 当前时间戳（毫秒）
   */
  update(timestamp: number): void {
    if (!this.currentAnimation || !this.playing || this.paused) {
      return;
    }

    // 计算 deltaTime
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      return;
    }

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // 推进进度
    this.progress += deltaTime / this.currentAnimation.duration;

    // 限制进度在 [0, 1]
    if (this.progress >= 1) {
      this.progress = 1;
      this.currentAnimation.update(1);
      this.currentAnimation.finish();

      // 检查队列
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.currentAnimation = next;
        this.progress = 0;
        this.lastTimestamp = null;
        next.start();
      } else {
        // 队列为空，播放结束
        this.currentAnimation = null;
        this.playing = false;
        this.paused = false;

        // 通知状态变化和完成
        this.onStateChange?.(false);
        this.onComplete?.();
      }
    } else {
      this.currentAnimation.update(this.progress);
    }
  }

  /** 暂停 */
  pause(): void {
    this.paused = true;
  }

  /** 继续 */
  resume(): void {
    this.paused = false;
    this.lastTimestamp = null; // 重置时间戳，避免 deltaTime 过大
  }

  /** 重置 */
  reset(): void {
    if (this.currentAnimation) {
      this.currentAnimation.finish();
    }
    this.currentAnimation = null;
    this.queue = [];
    this.progress = 0;
    this.lastTimestamp = null;

    const wasPlaying = this.playing;
    this.playing = false;
    this.paused = false;

    // 如果之前正在播放，通知状态变化
    if (wasPlaying) {
      this.onStateChange?.(false);
    }
  }

  /** 是否正在播放 */
  isPlaying(): boolean {
    return this.playing;
  }

  /** 是否暂停 */
  isPaused(): boolean {
    return this.paused;
  }
}
