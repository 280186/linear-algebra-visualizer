import { Mat2 } from '../math/Mat2';
import { Vec2 } from '../math/Vec2';
import { Camera2D } from '../render/Camera2D';
import { drawAxes } from '../render/drawAxes';
import { drawTransformedAxes } from '../render/drawTransformedAxes';
import { Grid } from './Grid';
import { VectorArrow } from './VectorArrow';
import { UnitSquare } from './UnitSquare';
import { UserVector, LabelLayout } from './UserVector';
import { BasisGrid } from './BasisGrid';

/**
 * Scene 渲染选项
 */
export interface SceneOptions {
  /** 变换网格强度 0.1 ~ 1.0 */
  transformedGridOpacity?: number;
  /** 新基网格强度 0.1 ~ 1.0 */
  basisGridOpacity?: number;
  /** 基矩阵 P（如果提供且 showBasis=true，绘制新基网格） */
  basisMatrix?: Mat2 | null;
  /** 是否显示基与坐标信息 */
  showBasis?: boolean;
}

/**
 * Scene - 场景管理器
 *
 * 职责：
 * 1. 管理所有可绘制对象
 * 2. 统一 render
 * 3. 控制绘制顺序（静态参考层 → 变换层）
 * 4. 让 CanvasView 尽量只负责 Canvas 生命周期和调用 render
 */
export class Scene {
  /** 网格对象 */
  private grid: Grid;
  /** 单位正方形对象 */
  private unitSquare: UnitSquare;
  /** 新基网格对象 */
  private basisGrid: BasisGrid;
  /** 变换后的基向量 e1' */
  private e1Transformed: VectorArrow;
  /** 变换后的基向量 e2' */
  private e2Transformed: VectorArrow;
  /** 原始基向量 e1（半透明） */
  private e1Original: VectorArrow;
  /** 原始基向量 e2（半透明） */
  private e2Original: VectorArrow;
  /** 标签布局管理器 */
  private labelLayout: LabelLayout;

  constructor() {
    // 创建场景对象
    this.grid = new Grid(1);
    this.unitSquare = new UnitSquare();
    this.basisGrid = new BasisGrid();
    this.labelLayout = new LabelLayout();

    // 变换后的基向量（红色 e1'，绿色 e2'）
    this.e1Transformed = new VectorArrow(
      new Vec2(1, 0),
      "e1'",
      { color: '#ff4444', lineWidth: 3, transformed: true }
    );
    this.e2Transformed = new VectorArrow(
      new Vec2(0, 1),
      "e2'",
      { color: '#44ff44', lineWidth: 3, transformed: true }
    );

    // 原始基向量（半透明，不经过变换）
    this.e1Original = new VectorArrow(
      new Vec2(1, 0),
      'e1',
      { color: 'rgba(255, 68, 68, 0.3)', lineWidth: 2, transformed: false }
    );
    this.e2Original = new VectorArrow(
      new Vec2(0, 1),
      'e2',
      { color: 'rgba(68, 255, 68, 0.3)', lineWidth: 2, transformed: false }
    );
  }

  /**
   * 渲染整个场景
   * @param ctx Canvas 2D 上下文
   * @param camera 相机对象
   * @param canvasWidth Canvas 宽度
   * @param canvasHeight Canvas 高度
   * @param transform 当前变换矩阵 M(t)
   * @param userVectors 用户向量数组
   * @param options 渲染选项
   */
  render(
    ctx: CanvasRenderingContext2D,
    camera: Camera2D,
    canvasWidth: number,
    canvasHeight: number,
    transform: Mat2,
    userVectors?: UserVector[],
    options?: SceneOptions
  ): void {
    // 重置标签布局（每帧重置）
    this.labelLayout.reset();

    const gridOpacity = options?.transformedGridOpacity ?? 0.6;
    const basisGridOpacity = options?.basisGridOpacity ?? 0.4;
    const showBasis = options?.showBasis ?? false;
    const basisMatrix = options?.basisMatrix;

    // === 新基网格层（如果开启） ===
    if (showBasis && basisMatrix) {
      this.basisGrid.render(ctx, camera, canvasWidth, canvasHeight, basisMatrix, basisGridOpacity);
    }

    // === 静态参考层（颜色较淡） ===

    // 1. 静态网格（低透明度）
    this.grid.render(ctx, camera, canvasWidth, canvasHeight, undefined, {
      color: 'rgba(255, 255, 255, 0.15)',
      lineWidth: 1
    });

    // 2. 静态坐标轴（半透明白色）
    drawAxes(ctx, camera, canvasWidth, canvasHeight);

    // 3. 原始基向量（半透明）
    this.e1Original.render(ctx, camera);
    this.e2Original.render(ctx, camera);

    // 4. 原始用户向量（半透明）
    if (userVectors) {
      for (const v of userVectors) {
        if (!v.transformed) {
          v.render(ctx, camera);
        }
      }
    }

    // === 变换层（颜色明显） ===

    // 5. 变换后的网格（根据强度设置）
    this.grid.render(ctx, camera, canvasWidth, canvasHeight, transform, {
      color: `rgba(255, 255, 255, ${gridOpacity})`,
      lineWidth: 1
    });

    // 6. 变换后的坐标轴（更粗更亮）
    drawTransformedAxes(ctx, camera, canvasWidth, canvasHeight, transform);

    // 7. 变换后的单位正方形
    this.unitSquare.render(ctx, camera, transform);

    // 8. 变换后的基向量
    this.e1Transformed.render(ctx, camera, transform);
    this.e2Transformed.render(ctx, camera, transform);

    // 9. 变换后的用户向量（高亮，带标签布局）
    if (userVectors) {
      for (const v of userVectors) {
        if (v.transformed) {
          v.render(ctx, camera, transform, this.labelLayout);
        }
      }
    }
  }
}
