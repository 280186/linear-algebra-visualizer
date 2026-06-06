import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';
import { Camera2D } from '../render/Camera2D';
import { drawPolygon } from '../render/drawPolygon';

const EPS = 1e-8;

/**
 * UnitSquare - 单位正方形场景对象
 *
 * 初始四个点：
 *   (0,0) → (1,0) → (1,1) → (0,1)
 *
 * 通过当前矩阵变换后绘制成平行四边形。
 * 颜色根据行列式变化：
 *   - det > 0：黄色（方向保持）
 *   - det < 0：红色（方向翻转）
 *   - |det| ≈ 0：灰色（压缩/不可逆）
 */
export class UnitSquare {
  /** 四个顶点 */
  private corners: Vec2[];

  constructor() {
    this.corners = [
      new Vec2(0, 0),
      new Vec2(1, 0),
      new Vec2(1, 1),
      new Vec2(0, 1)
    ];
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
    // 计算变换后的顶点
    const points = transform
      ? this.corners.map(v => transform.multiplyVec(v))
      : this.corners;

    // 根据 det 决定颜色
    let fillColor = 'rgba(255, 255, 0, 0.3)';
    let strokeColor = 'rgba(255, 255, 0, 0.8)';

    if (transform) {
      const det = transform.determinant();
      if (det > EPS) {
        // 方向保持：黄色
        fillColor = 'rgba(255, 255, 0, 0.3)';
        strokeColor = 'rgba(255, 255, 0, 0.8)';
      } else if (det < -EPS) {
        // 方向翻转：红色
        fillColor = 'rgba(255, 0, 0, 0.3)';
        strokeColor = 'rgba(255, 0, 0, 0.8)';
      } else {
        // 压缩/不可逆：灰色
        fillColor = 'rgba(128, 128, 128, 0.3)';
        strokeColor = 'rgba(128, 128, 128, 0.8)';
      }
    }

    drawPolygon(ctx, camera, points, {
      fillColor,
      strokeColor,
      lineWidth: 2
    });
  }
}
