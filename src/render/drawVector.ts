import { Vec2 } from '../math/Vec2';
import { Camera2D } from './Camera2D';

interface DrawVectorOptions {
  color?: string;
  lineWidth?: number;
  headLength?: number;
  headAngle?: number;
}

/**
 * 绘制向量箭头（从原点到 v）
 * @param ctx Canvas 2D 上下文
 * @param camera 相机对象
 * @param v 向量（世界坐标）
 * @param options 绘制选项
 */
export function drawVector(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  v: Vec2,
  options: DrawVectorOptions = {}
): void {
  const {
    color = '#ff4444',
    lineWidth = 3,
    headLength = 15,
    headAngle = Math.PI / 6
  } = options;

  const origin = camera.worldToScreen(Vec2.zero());
  const end = camera.worldToScreen(v);

  // 计算箭头方向
  const dx = end.x - origin.x;
  const dy = end.y - origin.y;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // 绘制线段
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // 绘制箭头
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - headAngle),
    end.y - headLength * Math.sin(angle - headAngle)
  );
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + headAngle),
    end.y - headLength * Math.sin(angle + headAngle)
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 绘制向量及其标签
 */
export function drawVectorWithLabel(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  v: Vec2,
  label: string,
  options: DrawVectorOptions = {}
): void {
  drawVector(ctx, camera, v, options);

  const end = camera.worldToScreen(v);

  ctx.save();
  ctx.fillStyle = options.color || '#ff4444';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, end.x + 10, end.y - 5);
  ctx.restore();
}
