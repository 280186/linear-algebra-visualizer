import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';
import { Camera2D } from '../render/Camera2D';
import { drawVector } from '../render/drawVector';
import { Scene } from '../scene/Scene';
import { UserVector } from '../scene/UserVector';
import { Timeline } from '../animation/Timeline';
import { ApplyMatrixAnimation } from '../animation/ApplyMatrixAnimation';
import { smoothStep } from '../animation/easing';
import { MatrixItem, VectorItem, BasisConfig, PathDemoState, EigenConfig, EigenResult } from '../types';
import { buildBasisMatrix, standardToBasisCoordinates } from '../utils/basis';

/**
 * CanvasView 暴露的控制接口
 */
export interface CanvasViewHandle {
  playSequence(sequence: MatrixItem[]): void;
  stepForward(cumulativeMatrices: Mat2[], currentIndex: number): void;
  stepBackward(cumulativeMatrices: Mat2[], currentIndex: number): void;
  playInverse(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  getCurrentMatrix(): Mat2;
  /** 设置路径演示步骤（无动画） */
  setPathStep(step: number): void;
  /** 触发 step 2 动画：v_E → Av_E，完成后调用 onComplete */
  stepPathAnimation(onComplete: () => void): void;
  /** 停止路径动画 */
  stopPathAnimation(): void;
}

interface CanvasViewProps {
  onAnimationComplete?: () => void;
  onCurrentMatrixChange?: (matrix: Mat2) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onStepChange?: (stepIndex: number) => void;
  vectorSet?: VectorItem[];
  transformedGridOpacity?: number;
  basisGridOpacity?: number;
  basisConfig?: BasisConfig;
  pathDemoState?: PathDemoState;
  /** 最终累计矩阵（路径演示和特征分析使用） */
  finalMatrix?: Mat2;
  /** 特征信息配置 */
  eigenConfig?: EigenConfig;
  /** 特征分析结果 */
  eigenResult?: EigenResult;
}

const ANIMATION_DURATION = 1500; // 1.5 秒

/**
 * Canvas 绘图区
 *
 * 职责：
 * 1. Canvas 生命周期管理
 * 2. Canvas 尺寸管理
 * 3. 创建 Scene 和 Timeline
 * 4. requestAnimationFrame 驱动 Timeline
 * 5. 调用 Scene.render()
 * 6. 鼠标拖拽平移
 * 7. 滚轮缩放
 */
export const CanvasView = forwardRef<CanvasViewHandle, CanvasViewProps>(
  ({ onAnimationComplete, onCurrentMatrixChange, onPlayStateChange, onStepChange, vectorSet, transformedGridOpacity, basisGridOpacity, basisConfig, pathDemoState, finalMatrix, eigenConfig, eigenResult }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const sceneRef = useRef<Scene>(new Scene());
    const timelineRef = useRef<Timeline>(new Timeline());
    const cameraRef = useRef<Camera2D>(Camera2D.default(800, 600, 50));

    // 当前矩阵（由 ApplyMatrixAnimation 更新）
    const currentMatrixRef = useRef<Mat2>(Mat2.identity());

    // 拖拽状态
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef<Vec2>(Vec2.zero());

    // 路径演示 overlay 状态（通过 ref 驱动，避免重渲染）
    const pathStepRef = useRef(0);
    const pathOverlayProgressRef = useRef(0);
    const pathSelectedVectorIdRef = useRef<string | null>(null);
    const finalMatrixRef = useRef<Mat2>(Mat2.identity());
    const pathAnimFrameRef = useRef<number | null>(null);

    // 同步外部 pathDemoState 到 refs
    useEffect(() => {
      if (pathDemoState) {
        pathStepRef.current = pathDemoState.stepIndex;
        pathOverlayProgressRef.current = pathDemoState.overlayProgress;
        pathSelectedVectorIdRef.current = pathDemoState.selectedVectorId;
      }
    }, [pathDemoState]);

    // 同步 finalMatrix 到 ref
    useEffect(() => {
      if (finalMatrix) {
        finalMatrixRef.current = finalMatrix;
      }
    }, [finalMatrix]);

    // 特征 overlay 状态（通过 ref 驱动）
    const eigenShowRef = useRef(false);
    const eigenSelectedIdRef = useRef<string | null>(null);
    const eigenScalarTRef = useRef(1);
    const eigenDirectionsRef = useRef<EigenResult['directions']>([]);
    const eigenKindRef = useRef<EigenResult['kind']>('no-real-eigenvalues');

    // 同步 eigenConfig/eigenResult 到 refs
    useEffect(() => {
      if (eigenConfig) {
        eigenShowRef.current = eigenConfig.showEigenInfo;
        eigenSelectedIdRef.current = eigenConfig.selectedDirectionId;
        eigenScalarTRef.current = eigenConfig.scalarT;
      }
    }, [eigenConfig]);

    useEffect(() => {
      if (eigenResult) {
        eigenDirectionsRef.current = eigenResult.directions;
        eigenKindRef.current = eigenResult.kind;
      }
    }, [eigenResult]);

    // 设置 Timeline 回调
    useEffect(() => {
      timelineRef.current.setCallbacks(
        (isPlaying) => {
          onPlayStateChange?.(isPlaying);
        },
        () => {
          // 动画队列全部完成
          onAnimationComplete?.();
        }
      );
    }, [onPlayStateChange, onAnimationComplete]);

    /**
     * 计算用户向量
     */
    const getUserVectors = useCallback((vectors: VectorItem[]): UserVector[] => {
      if (!vectors || vectors.length === 0) return [];

      const result: UserVector[] = [];
      for (const v of vectors) {
        const vec = new Vec2(v.vector[0], v.vector[1]);
        // 原始向量（半透明）
        result.push(new UserVector(vec, v.name, {
          color: 'rgba(255, 152, 0, 0.4)',
          transformed: false
        }));
        // 变换后向量（高亮，带 showValueLabel）
        result.push(new UserVector(vec, `${v.name}'`, {
          color: '#ff9800',
          transformed: true,
          showValueLabel: v.showValueLabel ?? false
        }));
      }
      return result;
    }, []);

    /**
     * 绘制路径演示 overlay
     * step 1: 绘制 v_E（绿色）
     * step 2: 从 v_E 动画到 Av_E
     * step 3/4: 绘制 Av_E（绿色）
     */
    const drawPathOverlay = useCallback((
      ctx: CanvasRenderingContext2D,
      camera: Camera2D,
      _transform: Mat2,
      basisMatrix: Mat2 | null,
    ) => {
      const step = pathStepRef.current;
      const progress = pathOverlayProgressRef.current;

      // step 0: 不绘制
      if (step === 0) return;

      // 需要 basisMatrix 和 vectorSet
      if (!basisMatrix || !vectorSet || vectorSet.length === 0) return;

      const PInverse = basisMatrix.inverse();
      if (!PInverse) return;

      // 获取选中的向量
      const selectedId = pathSelectedVectorIdRef.current;
      const selectedVec = vectorSet.find(v => v.id === selectedId) || vectorSet[0];
      if (!selectedVec) return;

      // 计算 v_E = P [v]_B
      const v = new Vec2(selectedVec.vector[0], selectedVec.vector[1]);
      const v_B = standardToBasisCoordinates(v, basisMatrix);
      if (!v_B) return;
      const v_E = basisMatrix.multiplyVec(v_B);

      // 计算 Av_E（使用 finalMatrix，路径演示的 A = finalMatrix）
      const A = finalMatrixRef.current;
      const Av_E = A.multiplyVec(v_E);

      // 根据步骤绘制
      if (step === 1) {
        // 绘制 v_E（绿色）
        drawVector(ctx, camera, v_E, {
          color: '#4CAF50',
          lineWidth: 3,
        });
      } else if (step === 2) {
        // 动画：从 v_E 到 Av_E
        const t = Math.max(0, Math.min(1, progress));
        const currentVec = new Vec2(
          v_E.x + t * (Av_E.x - v_E.x),
          v_E.y + t * (Av_E.y - v_E.y),
        );
        // 绘制起始 v_E（半透明参考）
        drawVector(ctx, camera, v_E, {
          color: 'rgba(76, 175, 80, 0.3)',
          lineWidth: 2,
        });
        // 绘制当前插值向量
        drawVector(ctx, camera, currentVec, {
          color: '#FF9800',
          lineWidth: 3,
        });
      } else if (step === 3 || step === 4) {
        // 绘制 Av_E（绿色）
        drawVector(ctx, camera, Av_E, {
          color: '#4CAF50',
          lineWidth: 3,
        });
      }
    }, [vectorSet]);

    /**
     * 绘制特征方向 overlay
     * - 特征方向直线（过原点整条线）
     * - 选中方向的示例向量 v = t*u 和 Av = λ*v
     * - 路径演示播放时降低透明度
     */
    const drawEigenOverlay = useCallback((
      ctx: CanvasRenderingContext2D,
      camera: Camera2D,
      canvasWidth: number,
      canvasHeight: number,
    ) => {
      if (!eigenShowRef.current) return;
      if (eigenKindRef.current === 'no-real-eigenvalues') return;

      const directions = eigenDirectionsRef.current;
      if (directions.length === 0) return;

      // 路径演示播放时降低透明度
      const pathActive = pathStepRef.current > 0;
      const lineAlpha = pathActive ? 0.15 : 0.4;
      const selectedAlpha = pathActive ? 0.25 : 0.7;

      // 计算可视范围的对角线半径（世界坐标），确保直线覆盖整个画布
      const topLeft = camera.screenToWorld(new Vec2(0, 0));
      const bottomRight = camera.screenToWorld(new Vec2(canvasWidth, canvasHeight));
      const R = Math.max(
        Math.abs(topLeft.x), Math.abs(bottomRight.x),
        Math.abs(topLeft.y), Math.abs(bottomRight.y),
      ) * 1.5;

      const selectedId = eigenSelectedIdRef.current;

      // 绘制每条特征方向直线
      for (const d of directions) {
        if (!d.direction) continue; // all-directions 不画线

        const isSelected = d.id === selectedId;
        const ux = d.direction[0];
        const uy = d.direction[1];

        const p1 = camera.worldToScreen(new Vec2(-R * ux, -R * uy));
        const p2 = camera.worldToScreen(new Vec2(R * ux, R * uy));

        ctx.save();
        ctx.strokeStyle = isSelected
          ? `rgba(0, 255, 255, ${selectedAlpha})`
          : `rgba(0, 255, 255, ${lineAlpha})`;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.setLineDash(isSelected ? [] : [6, 4]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 选中方向的示例向量 v 和 Av
      const selectedDir = directions.find(d => d.id === selectedId) || directions[0];
      if (!selectedDir) return;

      const dir = selectedDir.direction || [1, 0]; // all-directions 用 (1,0)
      const t = eigenScalarTRef.current;
      const lambda = selectedDir.lambda;

      const EPS_LOCAL = 1e-8;
      if (Math.abs(t) < EPS_LOCAL) return; // t=0 不画向量

      const vx = t * dir[0];
      const vy = t * dir[1];
      const Avx = lambda * vx;
      const Avy = lambda * vy;

      const vVec = new Vec2(vx, vy);
      const AvVec = new Vec2(Avx, Avy);

      // 绘制 v（绿色）
      drawVector(ctx, camera, vVec, {
        color: `rgba(76, 175, 80, ${pathActive ? 0.3 : 0.8})`,
        lineWidth: 2,
      });

      // 绘制 Av（橙色），只在 |λ| > EPS 时画（λ≈0 时 Av 是零向量，不画异常箭头）
      if (Math.abs(lambda) > EPS_LOCAL) {
        drawVector(ctx, camera, AvVec, {
          color: `rgba(255, 152, 0, ${pathActive ? 0.3 : 0.8})`,
          lineWidth: 2,
        });
      }

      // 简单标签
      const vScreen = camera.worldToScreen(vVec);
      const AvScreen = camera.worldToScreen(AvVec);

      ctx.save();
      ctx.font = '11px monospace';
      ctx.fillStyle = `rgba(76, 175, 80, ${pathActive ? 0.3 : 0.8})`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('v', vScreen.x + 8, vScreen.y - 4);

      if (Math.abs(lambda) > EPS_LOCAL) {
        ctx.fillStyle = `rgba(255, 152, 0, ${pathActive ? 0.3 : 0.8})`;
        ctx.fillText(`Av=λv`, AvScreen.x + 8, AvScreen.y - 4);
      }
      ctx.restore();
    }, []);

    /**
     * 绘制一帧
     */
    const drawFrame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, matrix: Mat2) => {
      const camera = cameraRef.current;
      const userVectors = getUserVectors(vectorSet || []);

      // 构造基矩阵
      const basisMatrix = basisConfig
        ? buildBasisMatrix(
            new Vec2(basisConfig.b1[0], basisConfig.b1[1]),
            new Vec2(basisConfig.b2[0], basisConfig.b2[1])
          )
        : null;

      // 清空画布
      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 使用 Scene 渲染所有对象（包括用户向量）
      sceneRef.current.render(ctx, camera, canvas.width, canvas.height, matrix, userVectors, {
        transformedGridOpacity,
        basisGridOpacity,
        basisMatrix,
        showBasis: basisConfig?.showBasisCoordinateInfo ?? false
      });

      // === 路径演示 overlay ===
      drawPathOverlay(ctx, camera, matrix, basisMatrix);

      // === 特征方向 overlay ===
      drawEigenOverlay(ctx, camera, canvas.width, canvas.height);
    }, [vectorSet, getUserVectors, transformedGridOpacity, basisGridOpacity, basisConfig]);

    /**
     * 动画循环
     */
    const animate = useCallback((timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 更新 Timeline
      timelineRef.current.update(timestamp);

      // 绘制当前帧
      drawFrame(ctx, canvas, currentMatrixRef.current);

      // 继续动画循环
      animationRef.current = requestAnimationFrame(animate);
    }, [drawFrame]);

    // 开始动画循环
    useEffect(() => {
      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        // 清理路径动画
        if (pathAnimFrameRef.current) {
          cancelAnimationFrame(pathAnimFrameRef.current);
          pathAnimFrameRef.current = null;
        }
      };
    }, [animate]);

    // 绘制初始状态
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawFrame(ctx, canvas, currentMatrixRef.current);
    }, [drawFrame]);

    // 处理窗口大小变化
    useEffect(() => {
      const handleResize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        // 更新相机（保持当前缩放级别）
        const currentScale = cameraRef.current.scale;
        cameraRef.current = Camera2D.default(canvas.width, canvas.height, currentScale);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawFrame(ctx, canvas, currentMatrixRef.current);
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      return () => window.removeEventListener('resize', handleResize);
    }, [drawFrame]);

    // 处理鼠标滚轮缩放
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const rect = canvas.getBoundingClientRect();
        const mousePos = new Vec2(e.clientX - rect.left, e.clientY - rect.top);

        cameraRef.current.zoom(factor, mousePos);

        // 重绘
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawFrame(ctx, canvas, currentMatrixRef.current);
        }
      };

      canvas.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        canvas.removeEventListener('wheel', handleWheel);
      };
    }, [drawFrame]);

    // 处理鼠标拖拽平移
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleMouseDown = (e: MouseEvent) => {
        if (e.button === 0) { // 左键
          isDraggingRef.current = true;
          lastMousePosRef.current = new Vec2(e.clientX, e.clientY);
          canvas.style.cursor = 'grabbing';
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;

        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;

        cameraRef.current.panByScreenDelta(dx, dy);
        lastMousePosRef.current = new Vec2(e.clientX, e.clientY);

        // 重绘
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawFrame(ctx, canvas, currentMatrixRef.current);
        }
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        canvas.style.cursor = 'default';
      };

      canvas.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [drawFrame]);

    // 暴露控制接口
    useImperativeHandle(ref, () => ({
      /**
       * 播放完整矩阵序列
       * 从单位矩阵开始，依次播放每个矩阵
       */
      playSequence(sequence: MatrixItem[]): void {
        // 中断当前动画
        timelineRef.current.reset();

        // 设置当前矩阵为单位矩阵
        currentMatrixRef.current = Mat2.identity();
        onCurrentMatrixChange?.(Mat2.identity());
        onStepChange?.(0);

        if (sequence.length === 0) {
          onAnimationComplete?.();
          return;
        }

        // 构建动画队列
        let current = Mat2.identity();

        for (let i = 0; i < sequence.length; i++) {
          const item = sequence[i];
          const m = Mat2.fromMatrix(item.matrix);
          const target = m.multiplyMat(current);
          const stepIndex = i + 1;

          const animation = new ApplyMatrixAnimation({
            from: current,
            to: target,
            duration: ANIMATION_DURATION,
            easing: smoothStep,
            onUpdate: (mat: Mat2) => {
              currentMatrixRef.current = mat;
              onCurrentMatrixChange?.(mat);
            },
            onFinish: () => {
              currentMatrixRef.current = target;
              onCurrentMatrixChange?.(target);
              onStepChange?.(stepIndex);
            }
          });

          if (i === 0) {
            timelineRef.current.play(animation);
          } else {
            timelineRef.current.enqueue(animation);
          }

          current = target;
        }
      },

      /**
       * 单步前进
       * @param cumulativeMatrices 累计矩阵数组 [C0=I, C1, C2, ..., Cn]
       * @param currentIndex 当前步骤索引
       */
      stepForward(cumulativeMatrices: Mat2[], currentIndex: number): void {
        const targetIndex = currentIndex + 1;
        if (targetIndex >= cumulativeMatrices.length) return;

        const from = currentMatrixRef.current;
        const to = cumulativeMatrices[targetIndex];

        timelineRef.current.play(new ApplyMatrixAnimation({
          from,
          to,
          duration: ANIMATION_DURATION,
          easing: smoothStep,
          onUpdate: (m: Mat2) => {
            currentMatrixRef.current = m;
            onCurrentMatrixChange?.(m);
          },
          onFinish: () => {
            currentMatrixRef.current = to;
            onCurrentMatrixChange?.(to);
            onStepChange?.(targetIndex);
          }
        }));
      },

      /**
       * 单步回退
       * @param cumulativeMatrices 累计矩阵数组 [C0=I, C1, C2, ..., Cn]
       * @param currentIndex 当前步骤索引
       */
      stepBackward(cumulativeMatrices: Mat2[], currentIndex: number): void {
        const targetIndex = currentIndex - 1;
        if (targetIndex < 0) return;

        const from = currentMatrixRef.current;
        const to = cumulativeMatrices[targetIndex];

        timelineRef.current.play(new ApplyMatrixAnimation({
          from,
          to,
          duration: ANIMATION_DURATION,
          easing: smoothStep,
          onUpdate: (m: Mat2) => {
            currentMatrixRef.current = m;
            onCurrentMatrixChange?.(m);
          },
          onFinish: () => {
            currentMatrixRef.current = to;
            onCurrentMatrixChange?.(to);
            onStepChange?.(targetIndex);
          }
        }));
      },

      /**
       * 播放逆变换
       * 从当前矩阵播放到单位矩阵
       * 内部必须检查当前矩阵是否可逆
       */
      playInverse(): void {
        const from = currentMatrixRef.current;

        // 内部检查是否可逆
        const inverse = from.inverse();
        if (!inverse) return;

        const to = Mat2.identity();

        timelineRef.current.play(new ApplyMatrixAnimation({
          from,
          to,
          duration: ANIMATION_DURATION,
          easing: smoothStep,
          onUpdate: (m: Mat2) => {
            currentMatrixRef.current = m;
            onCurrentMatrixChange?.(m);
          },
          onFinish: () => {
            currentMatrixRef.current = to;
            onCurrentMatrixChange?.(to);
            onStepChange?.(0);
            onPlayStateChange?.(false);
            onAnimationComplete?.();
          }
        }));
      },

      /**
       * 暂停
       */
      pause(): void {
        timelineRef.current.pause();
      },

      /**
       * 继续
       */
      resume(): void {
        timelineRef.current.resume();
      },

      /**
       * 重置
       */
      reset(): void {
        timelineRef.current.reset();
        currentMatrixRef.current = Mat2.identity();
        onCurrentMatrixChange?.(Mat2.identity());
        onStepChange?.(0);
      },

      /**
       * 获取当前矩阵
       */
      getCurrentMatrix(): Mat2 {
        return currentMatrixRef.current.clone();
      },

      /**
       * 设置路径演示步骤（无动画，直接跳转）
       */
      setPathStep(step: number): void {
        pathStepRef.current = step;
        pathOverlayProgressRef.current = 0;
      },

      /**
       * 触发 step 2 动画：v_E → Av_E
       * 使用独立的 requestAnimationFrame 循环驱动 overlayProgress
       */
      stepPathAnimation(onComplete: () => void): void {
        // 清理之前的动画
        if (pathAnimFrameRef.current) {
          cancelAnimationFrame(pathAnimFrameRef.current);
          pathAnimFrameRef.current = null;
        }

        pathStepRef.current = 2;
        pathOverlayProgressRef.current = 0;

        const duration = 1500; // 1.5 秒
        let startTime: number | null = null;

        const step = (timestamp: number) => {
          if (startTime === null) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const t = Math.min(1, elapsed / duration);

          // smoothStep 缓动
          const eased = t * t * (3 - 2 * t);
          pathOverlayProgressRef.current = eased;

          if (t < 1) {
            pathAnimFrameRef.current = requestAnimationFrame(step);
          } else {
            pathOverlayProgressRef.current = 1;
            pathAnimFrameRef.current = null;
            onComplete();
          }
        };

        pathAnimFrameRef.current = requestAnimationFrame(step);
      },

      /**
       * 停止路径动画
       */
      stopPathAnimation(): void {
        if (pathAnimFrameRef.current) {
          cancelAnimationFrame(pathAnimFrameRef.current);
          pathAnimFrameRef.current = null;
        }
      }
    }), [onAnimationComplete, onCurrentMatrixChange, onStepChange]);

    return (
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    );
  }
);

CanvasView.displayName = 'CanvasView';
