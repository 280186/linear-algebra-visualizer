import { Vec2 } from '../math/Vec2';

/** 缩放范围限制 */
const MIN_ZOOM = 20;
const MAX_ZOOM = 200;

/**
 * Camera2D - 负责世界坐标和屏幕坐标的转换
 *
 * 约定：
 * - 世界坐标：数学坐标系，y 轴向上
 * - 屏幕坐标：Canvas 坐标系，y 轴向下
 *
 * 默认视口：世界原点在 Canvas 中心，1 单位 = scale 像素
 */
export class Camera2D {
  /** 世界坐标原点在屏幕上的位置（像素） */
  public origin: Vec2;
  /** 每个世界单位对应的像素数（缩放级别） */
  public scale: number;

  constructor(origin: Vec2, scale: number = 50) {
    this.origin = origin;
    this.scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
  }

  /**
   * 世界坐标 → 屏幕坐标
   * 屏幕 y 轴与世界 y 轴方向相反
   */
  worldToScreen(v: Vec2): Vec2 {
    return new Vec2(
      this.origin.x + v.x * this.scale,
      this.origin.y - v.y * this.scale  // y 轴翻转
    );
  }

  /**
   * 屏幕坐标 → 世界坐标
   */
  screenToWorld(v: Vec2): Vec2 {
    return new Vec2(
      (v.x - this.origin.x) / this.scale,
      -(v.y - this.origin.y) / this.scale  // y 轴翻转
    );
  }

  /**
   * 缩放
   * @param factor 缩放因子（>1 放大，<1 缩小）
   * @param screenCenter 缩放中心（屏幕坐标）
   */
  zoom(factor: number, screenCenter: Vec2): void {
    const oldScale = this.scale;
    const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldScale * factor));

    // 调整原点，使缩放中心保持不变
    const worldBefore = this.screenToWorld(screenCenter);
    this.scale = newScale;
    const worldAfter = this.screenToWorld(screenCenter);

    this.origin = new Vec2(
      this.origin.x + (worldAfter.x - worldBefore.x) * this.scale,
      this.origin.y - (worldAfter.y - worldBefore.y) * this.scale
    );
  }

  /**
   * 平移（屏幕坐标增量）
   * @param dx 屏幕 x 方向增量（像素）
   * @param dy 屏幕 y 方向增量（像素）
   */
  panByScreenDelta(dx: number, dy: number): void {
    this.origin = new Vec2(this.origin.x + dx, this.origin.y + dy);
  }

  /**
   * 创建默认相机（原点在 Canvas 中心）
   */
  static default(canvasWidth: number, canvasHeight: number, scale: number = 50): Camera2D {
    return new Camera2D(
      new Vec2(canvasWidth / 2, canvasHeight / 2),
      scale
    );
  }
}
