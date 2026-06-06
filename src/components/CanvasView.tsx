import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';
import { Camera2D } from '../render/Camera2D';
import { Scene } from '../scene/Scene';
import { UserVector } from '../scene/UserVector';
import { Timeline } from '../animation/Timeline';
import { ApplyMatrixAnimation } from '../animation/ApplyMatrixAnimation';
import { smoothStep } from '../animation/easing';
import { MatrixItem, VectorItem, BasisConfig } from '../types';
import { buildBasisMatrix } from '../utils/basis';

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
  ({ onAnimationComplete, onCurrentMatrixChange, onPlayStateChange, onStepChange, vectorSet, transformedGridOpacity, basisGridOpacity, basisConfig }, ref) => {
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
