import { Vec2 } from '../math/Vec2';
import { Camera2D } from './Camera2D';

interface DrawPolygonOptions {
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: number;
}

/**
 * 绘制多边形（世界坐标点数组）
 * @param ctx Canvas 2D 上下文
 * @param camera 相机对象
 * @param points 多边形顶点（世界坐标，按顺序）
 * @param options 绘制选项
 */
export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  points: Vec2[],
  options: DrawPolygonOptions = {}
): void {
  if (points.length < 3) return;

  const {
    fillColor = 'rgba(255, 255, 0, 0.3)',
    strokeColor = 'rgba(255, 255, 0, 0.8)',
    lineWidth = 2
  } = options;

  const screenPoints = points.map(p => camera.worldToScreen(p));

  ctx.save();

  // 填充
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
  for (let i = 1; i < screenPoints.length; i++) {
    ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 边框
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制单位正方形（默认 [0,0] 到 [1,1]）
 * @param ctx Canvas 2D 上下文
 * @param camera 相机对象
 * @param transform 可选的变换矩阵（用于变换后的正方形）
 */
export function drawUnitSquare(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  transform?: (v: Vec2) => Vec2
): void {
  const corners = [
    new Vec2(0, 0),
    new Vec2(1, 0),
    new Vec2(1, 1),
    new Vec2(0, 1)
  ];

  const transformedCorners = transform
    ? corners.map(transform)
    : corners;

  drawPolygon(ctx, camera, transformedCorners, {
    fillColor: 'rgba(255, 255, 0, 0.3)',
    strokeColor: 'rgba(255, 255, 0, 0.8)',
    lineWidth: 2
  });
}
