import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';
import { Camera2D } from '../render/Camera2D';

/**
 * Grid - 网格场景对象
 *
 * 职责：
 * 1. 保存网格范围和间距
 * 2. 绘制静态网格
 * 3. 绘制变换后的网格
 * 4. 不直接依赖 React
 */
export class Grid {
  /** 网格间距（世界坐标单位） */
  public spacing: number;

  constructor(spacing: number = 1) {
    this.spacing = spacing;
  }

  /**
   * 绘制网格
   * @param ctx Canvas 2D 上下文
   * @param camera 相机对象
   * @param canvasWidth Canvas 宽度
   * @param canvasHeight Canvas 高度
   * @param transform 可选的变换矩阵
   * @param options 绘制选项
   */
  render(
    ctx: CanvasRenderingContext2D,
    camera: Camera2D,
    canvasWidth: number,
    canvasHeight: number,
    transform?: Mat2,
    options?: { color?: string; lineWidth?: number }
  ): void {
    if (transform) {
      // 绘制变换后的网格
      this.drawTransformedGrid(ctx, camera, canvasWidth, canvasHeight, transform, options);
    } else {
      // 绘制静态网格（支持自定义颜色）
      this.drawStaticGrid(ctx, camera, canvasWidth, canvasHeight, options);
    }
  }

  /**
   * 绘制静态网格
   */
  private drawStaticGrid(
    ctx: CanvasRenderingContext2D,
    camera: Camera2D,
    canvasWidth: number,
    canvasHeight: number,
    options?: { color?: string; lineWidth?: number }
  ): void {
    const color = options?.color || 'rgba(255, 255, 255, 0.2)';
    const lineWidth = options?.lineWidth || 1;

    // 计算可见的世界坐标范围
    const topLeft = camera.screenToWorld(new Vec2(0, 0));
    const bottomRight = camera.screenToWorld(new Vec2(canvasWidth, canvasHeight));

    const minX = Math.floor(topLeft.x / this.spacing) * this.spacing;
    const maxX = Math.ceil(bottomRight.x / this.spacing) * this.spacing;
    const minY = Math.floor(bottomRight.y / this.spacing) * this.spacing;
    const maxY = Math.ceil(topLeft.y / this.spacing) * this.spacing;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    // 绘制垂直线
    for (let x = minX; x <= maxX; x += this.spacing) {
      const start = camera.worldToScreen(new Vec2(x, minY));
      const end = camera.worldToScreen(new Vec2(x, maxY));
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // 绘制水平线
    for (let y = minY; y <= maxY; y += this.spacing) {
      const start = camera.worldToScreen(new Vec2(minX, y));
      const end = camera.worldToScreen(new Vec2(maxX, y));
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 绘制变换后的网格
   *
   * 使用逆矩阵反推原始采样范围，确保变换后网格覆盖整个可视区域。
   */
  private drawTransformedGrid(
    ctx: CanvasRenderingContext2D,
    camera: Camera2D,
    canvasWidth: number,
    canvasHeight: number,
    transform: Mat2,
    options?: { color?: string; lineWidth?: number }
  ): void {
    const color = options?.color || 'rgba(255, 255, 255, 0.5)';
    const lineWidth = options?.lineWidth || 1;

    // 常量
    const margin = 2;
    const maxRange = 50;
    const maxGridLines = 200;
    const numPoints = 50; // 每条线的采样点数量

    // 获取屏幕四个角的世界坐标
    const topLeft = camera.screenToWorld(new Vec2(0, 0));
    const topRight = camera.screenToWorld(new Vec2(canvasWidth, 0));
    const bottomLeft = camera.screenToWorld(new Vec2(0, canvasHeight));
    const bottomRight = camera.screenToWorld(new Vec2(canvasWidth, canvasHeight));

    // 计算原始采样范围
    let sourceMinX: number;
    let sourceMaxX: number;
    let sourceMinY: number;
    let sourceMaxY: number;

    const inverse = transform.inverse();
    if (inverse) {
      // 可逆矩阵：用逆矩阵反推原始采样范围
      const corners = [topLeft, topRight, bottomLeft, bottomRight];
      const sourceCorners = corners.map(c => inverse.multiplyVec(c));

      // 计算反推后的边界
      sourceMinX = Math.min(...sourceCorners.map(c => c.x)) - margin;
      sourceMaxX = Math.max(...sourceCorners.map(c => c.x)) + margin;
      sourceMinY = Math.min(...sourceCorners.map(c => c.y)) - margin;
      sourceMaxY = Math.max(...sourceCorners.map(c => c.y)) + margin;
    } else {
      // 不可逆矩阵：使用 fallback 扩展
      const fallbackExpand = 4;
      const worldMinX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
      const worldMaxX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
      const worldMinY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
      const worldMaxY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);

      sourceMinX = worldMinX - fallbackExpand;
      sourceMaxX = worldMaxX + fallbackExpand;
      sourceMinY = worldMinY - fallbackExpand;
      sourceMaxY = worldMaxY + fallbackExpand;
    }

    // 限制范围，避免极端情况
    sourceMinX = Math.max(sourceMinX, -maxRange);
    sourceMaxX = Math.min(sourceMaxX, maxRange);
    sourceMinY = Math.max(sourceMinY, -maxRange);
    sourceMaxY = Math.min(sourceMaxY, maxRange);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    // 计算网格线范围
    const minGridX = Math.floor(sourceMinX / this.spacing) * this.spacing;
    const maxGridX = Math.ceil(sourceMaxX / this.spacing) * this.spacing;
    const minGridY = Math.floor(sourceMinY / this.spacing) * this.spacing;
    const maxGridY = Math.ceil(sourceMaxY / this.spacing) * this.spacing;

    // 限制网格线数量
    const verticalLines = Math.floor((maxGridX - minGridX) / this.spacing) + 1;
    const horizontalLines = Math.floor((maxGridY - minGridY) / this.spacing) + 1;

    // 如果网格线过多，增大间距
    let effectiveSpacing = this.spacing;
    if (verticalLines > maxGridLines) {
      effectiveSpacing = Math.max(this.spacing, (maxGridX - minGridX) / maxGridLines);
    }
    if (horizontalLines > maxGridLines) {
      effectiveSpacing = Math.max(effectiveSpacing, (maxGridY - minGridY) / maxGridLines);
    }

    // 绘制变换后的垂直线（原始 x = k）
    for (let k = minGridX; k <= maxGridX; k += effectiveSpacing) {
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const y = sourceMinY + (i / numPoints) * (sourceMaxY - sourceMinY);
        const worldPoint = new Vec2(k, y);
        const transformed = transform.multiplyVec(worldPoint);
        const screenPoint = camera.worldToScreen(transformed);

        if (i === 0) {
          ctx.moveTo(screenPoint.x, screenPoint.y);
        } else {
          ctx.lineTo(screenPoint.x, screenPoint.y);
        }
      }
      ctx.stroke();
    }

    // 绘制变换后的水平线（原始 y = k）
    for (let k = minGridY; k <= maxGridY; k += effectiveSpacing) {
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const x = sourceMinX + (i / numPoints) * (sourceMaxX - sourceMinX);
        const worldPoint = new Vec2(x, k);
        const transformed = transform.multiplyVec(worldPoint);
        const screenPoint = camera.worldToScreen(transformed);

        if (i === 0) {
          ctx.moveTo(screenPoint.x, screenPoint.y);
        } else {
          ctx.lineTo(screenPoint.x, screenPoint.y);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}
