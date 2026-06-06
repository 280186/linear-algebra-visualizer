import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';
import { Camera2D } from '../render/Camera2D';
import { isValidBasis } from '../utils/basis';

const MAX_GRID_LINES = 50;

/**
 * BasisGrid - 新基网格场景对象
 *
 * 职责：
 * 1. 保存基矩阵 P
 * 2. 绘制新基网格
 * 3. 绘制新基向量 b1, b2
 *
 * 新基网格绘制逻辑：
 * - 通过 P^{-1} 反推可视区域在新基坐标中的范围
 * - 在新基坐标中生成网格线
 * - 用 P 变回标准坐标绘制
 */
export class BasisGrid {
  /**
   * 绘制新基网格和向量
   * @param ctx Canvas 2D 上下文
   * @param camera 相机对象
   * @param canvasWidth Canvas 宽度
   * @param canvasHeight Canvas 高度
   * @param P 基矩阵
   * @param opacity 网格透明度 0.1 ~ 1.0
   */
  render(
    ctx: CanvasRenderingContext2D,
    camera: Camera2D,
    canvasWidth: number,
    canvasHeight: number,
    P: Mat2,
    opacity: number = 0.4
  ): void {
    // 如果 P 不可逆，不绘制
    if (!isValidBasis(P)) return;

    const PInverse = P.inverse();
    if (!PInverse) return;

    // 获取屏幕四个角的世界坐标
    const topLeft = camera.screenToWorld(new Vec2(0, 0));
    const topRight = camera.screenToWorld(new Vec2(canvasWidth, 0));
    const bottomLeft = camera.screenToWorld(new Vec2(0, canvasHeight));
    const bottomRight = camera.screenToWorld(new Vec2(canvasWidth, canvasHeight));

    // 通过 P^{-1} 反推新基坐标中的范围
    const corners = [topLeft, topRight, bottomLeft, bottomRight];
    const basisCorners = corners.map(c => PInverse.multiplyVec(c));

    const allX = basisCorners.map(c => c.x);
    const allY = basisCorners.map(c => c.y);

    const minU = Math.min(...allX) - 1;
    const maxU = Math.max(...allX) + 1;
    const minV = Math.min(...allY) - 1;
    const maxV = Math.max(...allY) + 1;

    // 限制网格线数量
    const rangeU = maxU - minU;
    const rangeV = maxV - minV;

    // 计算间距，确保不超过最大网格线数量
    let spacing = 1;
    while (rangeU / spacing > MAX_GRID_LINES || rangeV / spacing > MAX_GRID_LINES) {
      spacing *= 2;
    }

    const gridMinU = Math.floor(minU / spacing) * spacing;
    const gridMaxU = Math.ceil(maxU / spacing) * spacing;
    const gridMinV = Math.floor(minV / spacing) * spacing;
    const gridMaxV = Math.ceil(maxV / spacing) * spacing;

    // 采样点数量
    const numPoints = 50;

    ctx.save();

    // 绘制新基网格（青色，根据 opacity 调整透明度）
    ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
    ctx.lineWidth = 1;

    // 绘制 u = k 的线
    for (let u = gridMinU; u <= gridMaxU; u += spacing) {
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const v = minV + (i / numPoints) * (maxV - minV);
        const basisPoint = new Vec2(u, v);
        const worldPoint = P.multiplyVec(basisPoint);
        const screenPoint = camera.worldToScreen(worldPoint);

        if (i === 0) {
          ctx.moveTo(screenPoint.x, screenPoint.y);
        } else {
          ctx.lineTo(screenPoint.x, screenPoint.y);
        }
      }
      ctx.stroke();
    }

    // 绘制 v = k 的线
    for (let v = gridMinV; v <= gridMaxV; v += spacing) {
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const u = minU + (i / numPoints) * (maxU - minU);
        const basisPoint = new Vec2(u, v);
        const worldPoint = P.multiplyVec(basisPoint);
        const screenPoint = camera.worldToScreen(worldPoint);

        if (i === 0) {
          ctx.moveTo(screenPoint.x, screenPoint.y);
        } else {
          ctx.lineTo(screenPoint.x, screenPoint.y);
        }
      }
      ctx.stroke();
    }

    // 绘制新基向量 b1（青色）
    const b1 = P.col1();
    const b1End = camera.worldToScreen(b1);
    const origin = camera.worldToScreen(Vec2.zero());

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(b1End.x, b1End.y);
    ctx.stroke();

    // b1 箭头
    const angle1 = Math.atan2(b1End.y - origin.y, b1End.x - origin.x);
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(b1End.x, b1End.y);
    ctx.lineTo(b1End.x - 12 * Math.cos(angle1 - Math.PI / 6), b1End.y - 12 * Math.sin(angle1 - Math.PI / 6));
    ctx.lineTo(b1End.x - 12 * Math.cos(angle1 + Math.PI / 6), b1End.y - 12 * Math.sin(angle1 + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // b1 标签
    ctx.fillStyle = '#00ffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('b1', b1End.x + 8, b1End.y - 4);

    // 绘制新基向量 b2（品红）
    const b2 = P.col2();
    const b2End = camera.worldToScreen(b2);

    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(b2End.x, b2End.y);
    ctx.stroke();

    // b2 箭头
    const angle2 = Math.atan2(b2End.y - origin.y, b2End.x - origin.x);
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.moveTo(b2End.x, b2End.y);
    ctx.lineTo(b2End.x - 12 * Math.cos(angle2 - Math.PI / 6), b2End.y - 12 * Math.sin(angle2 - Math.PI / 6));
    ctx.lineTo(b2End.x - 12 * Math.cos(angle2 + Math.PI / 6), b2End.y - 12 * Math.sin(angle2 + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // b2 标签
    ctx.fillStyle = '#ff00ff';
    ctx.fillText('b2', b2End.x + 8, b2End.y - 4);

    ctx.restore();
  }
}
