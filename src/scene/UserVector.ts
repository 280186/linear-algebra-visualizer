import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';
import { Camera2D } from '../render/Camera2D';
import { drawVectorWithLabel } from '../render/drawVector';
import { formatNumber } from '../utils/numberInput';

/**
 * 标签矩形区域
 */
export interface LabelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * UserVector - 用户向量场景对象
 *
 * 职责：
 * 1. 保存原始向量坐标
 * 2. 保存标签和颜色
 * 3. 支持根据矩阵变换后绘制
 * 4. 支持显示列向量标签
 */
export class UserVector {
  /** 原始向量坐标 */
  public vector: Vec2;
  /** 标签 */
  public label: string;
  /** 颜色 */
  public color: string;
  /** 是否经过变换 */
  public transformed: boolean;
  /** 是否显示数值标签 */
  public showValueLabel: boolean;

  constructor(
    vector: Vec2,
    label: string,
    options: {
      color?: string;
      transformed?: boolean;
      showValueLabel?: boolean;
    } = {}
  ) {
    this.vector = vector;
    this.label = label;
    this.color = options.color || '#ff9800';
    this.transformed = options.transformed ?? false;
    this.showValueLabel = options.showValueLabel ?? false;
  }

  /**
   * 绘制向量
   * @param ctx Canvas 2D 上下文
   * @param camera 相机对象
   * @param transform 可选的变换矩阵
   * @param labelLayout 标签布局管理器
   */
  render(
    ctx: CanvasRenderingContext2D,
    camera: Camera2D,
    transform?: Mat2,
    labelLayout?: LabelLayout
  ): void {
    let endPoint = this.vector;

    // 如果需要变换且有变换矩阵，先变换向量
    if (this.transformed && transform) {
      endPoint = transform.multiplyVec(this.vector);
    }

    drawVectorWithLabel(ctx, camera, endPoint, this.label, {
      color: this.color,
      lineWidth: 2
    });

    // 如果显示数值标签且有变换矩阵，绘制列向量标签
    if (this.showValueLabel && this.transformed && transform) {
      this.drawColumnVectorLabel(ctx, camera, endPoint, labelLayout);
    }
  }

  /**
   * 绘制列向量标签
   * 格式：v1' = [ 2.00 ]
   *              [ 1.00 ]
   */
  private drawColumnVectorLabel(
    ctx: CanvasRenderingContext2D,
    camera: Camera2D,
    vec: Vec2,
    labelLayout?: LabelLayout
  ): void {
    const screenPos = camera.worldToScreen(vec);

    const xStr = formatNumber(vec.x);
    const yStr = formatNumber(vec.y);
    const labelText = `${this.label} = [ ${xStr} ]\n         [ ${yStr} ]`;

    // 计算标签尺寸
    ctx.save();
    ctx.font = '11px monospace';
    const lines = labelText.split('\n');
    const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const lineHeight = 14;
    const labelWidth = maxWidth + 10;
    const labelHeight = lines.length * lineHeight + 6;

    // 使用标签布局找到合适位置
    let labelX = screenPos.x + 15;
    let labelY = screenPos.y - labelHeight / 2;

    if (labelLayout) {
      const pos = labelLayout.findPosition(
        { x: labelX, y: labelY, width: labelWidth, height: labelHeight }
      );
      labelX = pos.x;
      labelY = pos.y;
    }

    // 绘制背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

    // 绘制文字
    ctx.fillStyle = this.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], labelX + 5, labelY + 3 + i * lineHeight);
    }

    ctx.restore();
  }
}

/**
 * LabelLayout - 标签防重叠布局管理器
 *
 * 每帧重置，使用矩形相交判断
 */
export class LabelLayout {
  private usedRects: LabelRect[] = [];

  /**
   * 重置布局（每帧调用）
   */
  reset(): void {
    this.usedRects = [];
  }

  /**
   * 查找不重叠的位置
   * @param preferred 首选位置和尺寸
   * @returns 调整后的位置
   */
  findPosition(preferred: LabelRect): LabelRect {
    const offsets = [
      { dx: 0, dy: 0 },      // 原位置
      { dx: 15, dy: -15 },    // 右上
      { dx: 15, dy: 15 },     // 右下
      { dx: -15, dy: -15 },   // 左上
      { dx: -15, dy: 15 },    // 左下
      { dx: 0, dy: -25 },     // 上
      { dx: 0, dy: 25 },      // 下
      { dx: 25, dy: 0 },      // 右
      { dx: -25, dy: 0 },     // 左
    ];

    // 尝试不同偏移
    for (const offset of offsets) {
      const candidate: LabelRect = {
        x: preferred.x + offset.dx,
        y: preferred.y + offset.dy,
        width: preferred.width,
        height: preferred.height
      };

      if (!this.isOverlapping(candidate)) {
        this.usedRects.push(candidate);
        return candidate;
      }
    }

    // 如果都重叠，增加距离
    const fallback: LabelRect = {
      x: preferred.x + 35,
      y: preferred.y + 35,
      width: preferred.width,
      height: preferred.height
    };
    this.usedRects.push(fallback);
    return fallback;
  }

  /**
   * 检查矩形是否与已有矩形重叠
   */
  private isOverlapping(rect: LabelRect): boolean {
    for (const used of this.usedRects) {
      if (this.rectsIntersect(rect, used)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 判断两个矩形是否相交
   */
  private rectsIntersect(a: LabelRect, b: LabelRect): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }
}
