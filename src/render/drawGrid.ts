import { Camera2D } from './Camera2D';

/**
 * 绘制网格
 * @param ctx Canvas 2D 上下文
 * @param camera 相机对象
 * @param canvasWidth Canvas 宽度
 * @param canvasHeight Canvas 高度
 * @param gridSpacing 网格间距（世界坐标单位，默认 1）
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  canvasWidth: number,
  canvasHeight: number,
  gridSpacing: number = 1
): void {
  // 计算可见的世界坐标范围
  const topLeft = camera.screenToWorld({ x: 0, y: 0 } as any);
  const bottomRight = camera.screenToWorld({ x: canvasWidth, y: canvasHeight } as any);

  const minX = Math.floor(topLeft.x / gridSpacing) * gridSpacing;
  const maxX = Math.ceil(bottomRight.x / gridSpacing) * gridSpacing;
  const minY = Math.floor(bottomRight.y / gridSpacing) * gridSpacing;
  const maxY = Math.ceil(topLeft.y / gridSpacing) * gridSpacing;

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;

  // 绘制垂直线
  for (let x = minX; x <= maxX; x += gridSpacing) {
    const start = camera.worldToScreen({ x, y: minY } as any);
    const end = camera.worldToScreen({ x, y: maxY } as any);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  // 绘制水平线
  for (let y = minY; y <= maxY; y += gridSpacing) {
    const start = camera.worldToScreen({ x: minX, y } as any);
    const end = camera.worldToScreen({ x: maxX, y } as any);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  ctx.restore();
}
