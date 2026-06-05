import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';
import { Camera2D } from './Camera2D';

/**
 * 绘制变换后的坐标轴
 *
 * 使用逆矩阵反推原始采样范围，确保变换后坐标轴覆盖整个可视区域。
 * x 轴：原始 y=0 上的点经过 transform 后连成的线
 * y 轴：原始 x=0 上的点经过 transform 后连成的线
 */
export function drawTransformedAxes(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  canvasWidth: number,
  canvasHeight: number,
  transform: Mat2
): void {
  // 常量
  const margin = 2;
  const maxRange = 50;
  const numPoints = 100;

  // 获取屏幕四个角的世界坐标
  const topLeft = camera.screenToWorld(new Vec2(0, 0));
  const topRight = camera.screenToWorld(new Vec2(canvasWidth, 0));
  const bottomLeft = camera.screenToWorld(new Vec2(0, canvasHeight));
  const bottomRight = camera.screenToWorld(new Vec2(canvasWidth, canvasHeight));

  // 计算原始采样范围
  let sourceMin: number;
  let sourceMax: number;

  const inverse = transform.inverse();
  if (inverse) {
    // 可逆矩阵：用逆矩阵反推原始采样范围
    const corners = [topLeft, topRight, bottomLeft, bottomRight];
    const sourceCorners = corners.map(c => inverse.multiplyVec(c));

    // 计算反推后的边界（取所有坐标的最小/最大值）
    const allValues = sourceCorners.flatMap(c => [c.x, c.y]);
    sourceMin = Math.min(...allValues) - margin;
    sourceMax = Math.max(...allValues) + margin;
  } else {
    // 不可逆矩阵：使用 fallback 扩展
    const fallbackExpand = 4;
    const worldCorners = [topLeft, topRight, bottomLeft, bottomRight];
    const allValues = worldCorners.flatMap(c => [c.x, c.y]);
    sourceMin = Math.min(...allValues) - fallbackExpand;
    sourceMax = Math.max(...allValues) + fallbackExpand;
  }

  // 限制范围
  sourceMin = Math.max(sourceMin, -maxRange);
  sourceMax = Math.min(sourceMax, maxRange);

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;

  // 绘制变换后的 x 轴（原始 y=0，x 从 sourceMin 到 sourceMax）
  ctx.beginPath();
  for (let i = 0; i <= numPoints; i++) {
    const x = sourceMin + (i / numPoints) * (sourceMax - sourceMin);
    const worldPoint = new Vec2(x, 0);
    const transformed = transform.multiplyVec(worldPoint);
    const screenPoint = camera.worldToScreen(transformed);

    if (i === 0) {
      ctx.moveTo(screenPoint.x, screenPoint.y);
    } else {
      ctx.lineTo(screenPoint.x, screenPoint.y);
    }
  }
  ctx.stroke();

  // 绘制变换后的 y 轴（原始 x=0，y 从 sourceMin 到 sourceMax）
  ctx.beginPath();
  for (let i = 0; i <= numPoints; i++) {
    const y = sourceMin + (i / numPoints) * (sourceMax - sourceMin);
    const worldPoint = new Vec2(0, y);
    const transformed = transform.multiplyVec(worldPoint);
    const screenPoint = camera.worldToScreen(transformed);

    if (i === 0) {
      ctx.moveTo(screenPoint.x, screenPoint.y);
    } else {
      ctx.lineTo(screenPoint.x, screenPoint.y);
    }
  }
  ctx.stroke();

  ctx.restore();
}
