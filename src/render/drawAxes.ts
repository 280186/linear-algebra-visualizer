import { Camera2D } from './Camera2D';

/**
 * 绘制二维坐标轴
 * @param ctx Canvas 2D 上下文
 * @param camera 相机对象
 * @param canvasWidth Canvas 宽度
 * @param canvasHeight Canvas 高度
 */
export function drawAxes(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  canvasWidth: number,
  canvasHeight: number
): void {
  const origin = camera.worldToScreen({ x: 0, y: 0 } as any);

  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;

  // x 轴
  ctx.beginPath();
  ctx.moveTo(0, origin.y);
  ctx.lineTo(canvasWidth, origin.y);
  ctx.stroke();

  // y 轴
  ctx.beginPath();
  ctx.moveTo(origin.x, 0);
  ctx.lineTo(origin.x, canvasHeight);
  ctx.stroke();

  // 原点标记
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
