import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';
import { Camera2D } from '../render/Camera2D';
import { drawPolygon } from '../render/drawPolygon';

/**
 * UnitSquare - 单位正方形场景对象
 *
 * 初始四个点：
 *   (0,0) → (1,0) → (1,1) → (0,1)
 *
 * 通过当前矩阵变换后绘制成平行四边形。
 */
export class UnitSquare {
  /** 四个顶点 */
  private corners: Vec2[];
  /** 填充颜色 */
  public fillColor: string;
  /** 边框颜色 */
  public strokeColor: string;

  constructor(
    options: {
      fillColor?: string;
      strokeColor?: string;
    } = {}
  ) {
    this.corners = [
      new Vec2(0, 0),
      new Vec2(1, 0),
      new Vec2(1, 1),
      new Vec2(0, 1)
    ];
    this.fillColor = options.fillColor || 'rgba(255, 255, 0, 0.3)';
    this.strokeColor = options.strokeColor || 'rgba(255, 255, 0, 0.8)';
  }

  /**
   * 绘制单位正方形
   * @param ctx Canvas 2D 上下文
   * @param camera 相机对象
   * @param transform 可选的变换矩阵
   */
  render(
    ctx: CanvasRenderingContext2D,
    camera: Camera2D,
    transform?: Mat2
  ): void {
    // 如果有变换矩阵，先变换顶点
    const points = transform
      ? this.corners.map(v => transform.multiplyVec(v))
      : this.corners;

    drawPolygon(ctx, camera, points, {
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      lineWidth: 2
    });
  }
}
