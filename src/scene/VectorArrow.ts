import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';
import { Camera2D } from '../render/Camera2D';
import { drawVectorWithLabel } from '../render/drawVector';

/**
 * VectorArrow - 向量箭头场景对象
 *
 * 职责：
 * 1. 保存起点、终点、颜色、标签
 * 2. 支持根据矩阵变换后绘制
 * 3. 不直接依赖 React
 */
export class VectorArrow {
  /** 终点（世界坐标） */
  public end: Vec2;
  /** 标签 */
  public label: string;
  /** 颜色 */
  public color: string;
  /** 线宽 */
  public lineWidth: number;
  /** 是否经过变换 */
  public transformed: boolean;

  constructor(
    end: Vec2,
    label: string,
    options: {
      color?: string;
      lineWidth?: number;
      transformed?: boolean;
    } = {}
  ) {
    this.end = end;
    this.label = label;
    this.color = options.color || '#ff4444';
    this.lineWidth = options.lineWidth || 3;
    this.transformed = options.transformed ?? true;
  }

  /**
   * 绘制向量箭头
   * @param ctx Canvas 2D 上下文
   * @param camera 相机对象
   * @param transform 可选的变换矩阵
   */
  render(
    ctx: CanvasRenderingContext2D,
    camera: Camera2D,
    transform?: Mat2
  ): void {
    let endPoint = this.end;

    // 如果需要变换且有变换矩阵，先变换终点
    if (this.transformed && transform) {
      endPoint = transform.multiplyVec(this.end);
    }

    drawVectorWithLabel(ctx, camera, endPoint, this.label, {
      color: this.color,
      lineWidth: this.lineWidth
    });
  }
}
