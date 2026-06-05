import { useState, useCallback, useRef, useMemo } from 'react';
import { CanvasView, CanvasViewHandle } from './components/CanvasView';
import { ResizableSidebar } from './components/ResizableSidebar';
import { MatrixList } from './components/MatrixList';
import { VectorList } from './components/VectorList';
import { ResultPanel } from './components/ResultPanel';
import { Mat2 } from './math/Mat2';
import { MatrixItem, VectorItem } from './types';
import { generateId } from './utils/id';
import { computeCumulativeMatrices } from './utils/matrixSequence';
import './styles/global.css';

/**
 * 应用主组件
 * 左侧控制面板，右侧 Canvas 绘图区
 */
function App() {
  // 矩阵序列
  const [matrixSequence, setMatrixSequence] = useState<MatrixItem[]>([
    { id: generateId(), name: 'M1', matrix: [[1, 1], [0, 1]] }
  ]);

  // 向量集合（第一个向量默认显示数值标签）
  const [vectorSet, setVectorSet] = useState<VectorItem[]>([
    { id: generateId(), name: 'v1', vector: [1, 1], showValueLabel: true }
  ]);

  // 变换网格强度
  const [transformedGridOpacity, setTransformedGridOpacity] = useState(0.6);

  // 动画状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 当前步骤索引（0 = 初始状态，1 = 执行完 A1，2 = 执行完 A2*A1，...）
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // 当前活跃的矩阵索引（用于高亮）
  // null = 初始状态 C0，k-1 = 停在 Ck 或正在播放 C(k-1)->Ck
  const [activeMatrixIndex, setActiveMatrixIndex] = useState<number | null>(null);

  // 当前动画矩阵（用于结果面板显示）
  const [currentMatrix, setCurrentMatrix] = useState<Mat2 | null>(null);

  // CanvasView ref
  const canvasViewRef = useRef<CanvasViewHandle>(null);

  // 计算累计矩阵
  const cumulativeMatrices = useMemo(() => {
    return computeCumulativeMatrices(matrixSequence);
  }, [matrixSequence]);

  // 添加矩阵
  const handleAddMatrix = useCallback(() => {
    if (matrixSequence.length >= 8) return;
    setMatrixSequence(prev => [
      ...prev,
      { id: generateId(), name: `M${prev.length + 1}`, matrix: [[1, 0], [0, 1]] }
    ]);
  }, [matrixSequence.length]);

  // 删除矩阵
  const handleRemoveMatrix = useCallback((id: string) => {
    setMatrixSequence(prev => prev.filter(item => item.id !== id));
  }, []);

  // 修改矩阵
  const handleMatrixChange = useCallback((id: string, matrix: [[number, number], [number, number]]) => {
    setMatrixSequence(prev => prev.map(item =>
      item.id === id ? { ...item, matrix } : item
    ));
  }, []);

  // 添加向量（新增向量默认不显示数值标签）
  const handleAddVector = useCallback(() => {
    if (vectorSet.length >= 8) return;
    setVectorSet(prev => [
      ...prev,
      { id: generateId(), name: `v${prev.length + 1}`, vector: [1, 0], showValueLabel: false }
    ]);
  }, [vectorSet.length]);

  // 删除向量
  const handleRemoveVector = useCallback((id: string) => {
    setVectorSet(prev => prev.filter(item => item.id !== id));
  }, []);

  // 修改向量
  const handleVectorChange = useCallback((id: string, vector: [number, number]) => {
    setVectorSet(prev => prev.map(item =>
      item.id === id ? { ...item, vector } : item
    ));
  }, []);

  // 修改向量显示标签选项
  const handleChangeShowLabel = useCallback((id: string, show: boolean) => {
    setVectorSet(prev => prev.map(item =>
      item.id === id ? { ...item, showValueLabel: show } : item
    ));
  }, []);

  // 统一 reset 逻辑
  const handleReset = useCallback(() => {
    if (!canvasViewRef.current) return;

    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setActiveMatrixIndex(null);
    setCurrentMatrix(null);

    canvasViewRef.current.reset();
  }, []);

  // 拖动排序处理
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    // 排序
    setMatrixSequence(prev => {
      const newSequence = [...prev];
      const [moved] = newSequence.splice(fromIndex, 1);
      newSequence.splice(toIndex, 0, moved);
      return newSequence;
    });

    // 统一 reset（cumulativeMatrices 会通过 useMemo 自动重新计算）
    if (canvasViewRef.current) {
      canvasViewRef.current.reset();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setActiveMatrixIndex(null);
    setCurrentMatrix(null);
  }, []);

  // 播放完整序列
  const handlePlaySequence = useCallback(() => {
    if (!canvasViewRef.current) return;

    setIsPlaying(true);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setActiveMatrixIndex(0);

    canvasViewRef.current.playSequence(matrixSequence);
  }, [matrixSequence]);

  // 单步前进
  const handleStepForward = useCallback(() => {
    if (!canvasViewRef.current) return;

    setIsPlaying(true);
    setIsPaused(false);

    canvasViewRef.current.stepForward(cumulativeMatrices, currentStepIndex);
  }, [cumulativeMatrices, currentStepIndex]);

  // 单步回退
  const handleStepBackward = useCallback(() => {
    if (!canvasViewRef.current) return;

    setIsPlaying(true);
    setIsPaused(false);

    canvasViewRef.current.stepBackward(cumulativeMatrices, currentStepIndex);
  }, [cumulativeMatrices, currentStepIndex]);

  // 动画完成
  const handleAnimationComplete = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  // 播放状态变化（由 Timeline 触发）
  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    if (!playing) {
      setIsPaused(false);
    }
  }, []);

  // 当前矩阵变化
  const handleCurrentMatrixChange = useCallback((matrix: Mat2) => {
    setCurrentMatrix(matrix);
  }, []);

  // 步骤变化（同步更新 activeMatrixIndex）
  const handleStepChange = useCallback((stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
    // stepIndex = 0 -> null (初始状态)
    // stepIndex = k -> k-1 (停在 Ck，高亮 Mk)
    setActiveMatrixIndex(stepIndex > 0 ? stepIndex - 1 : null);
  }, []);

  // 暂停/继续
  const handleTogglePause = useCallback(() => {
    if (!canvasViewRef.current) return;

    if (isPaused) {
      canvasViewRef.current.resume();
    } else {
      canvasViewRef.current.pause();
    }
    setIsPaused(prev => !prev);
  }, [isPaused]);

  // 计算按钮禁用状态
  const canStepForward = currentStepIndex < matrixSequence.length && !isPlaying;
  const canStepBackward = currentStepIndex > 0 && !isPlaying;

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100vh'
    }}>
      <ResizableSidebar defaultWidth={320} minWidth={260} maxWidth={520}>
        <div style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flex: 1
        }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>矩阵序列与向量</h2>

          {/* 当前步骤显示 */}
          <div style={{
            padding: '10px',
            backgroundColor: '#0f0f23',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <p style={{ margin: 0, color: '#aaa' }}>
              当前步骤：{currentStepIndex} / {matrixSequence.length}
            </p>
          </div>

          {/* 矩阵序列 */}
          <MatrixList
            items={matrixSequence}
            onAdd={handleAddMatrix}
            onRemove={handleRemoveMatrix}
            onChange={handleMatrixChange}
            onReorder={handleReorder}
            activeMatrixIndex={activeMatrixIndex}
            disabled={isPlaying && !isPaused}
          />

          {/* 用户向量 */}
          <VectorList
            items={vectorSet}
            onAdd={handleAddVector}
            onRemove={handleRemoveVector}
            onChange={handleVectorChange}
            onChangeShowLabel={handleChangeShowLabel}
            disabled={isPlaying && !isPaused}
          />

          {/* 显示设置 */}
          <div style={{
            padding: '10px',
            backgroundColor: '#0f0f23',
            borderRadius: '4px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#aaa' }}>
              显示设置
            </h3>
            <div>
              <label style={{ fontSize: '12px', color: '#888' }}>
                变换网格强度：{transformedGridOpacity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={transformedGridOpacity}
                onChange={(e) => setTransformedGridOpacity(parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
          </div>

          {/* 按钮 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* 单步控制 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleStepBackward}
                disabled={!canStepBackward}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: canStepBackward ? '#9C27B0' : '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: canStepBackward ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                上一步
              </button>

              <button
                onClick={handleStepForward}
                disabled={!canStepForward}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: canStepForward ? '#9C27B0' : '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: canStepForward ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                下一步
              </button>
            </div>

            <button
              onClick={handlePlaySequence}
              disabled={isPlaying && !isPaused}
              style={{
                padding: '10px',
                backgroundColor: (isPlaying && !isPaused) ? '#555' : '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: (isPlaying && !isPaused) ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {isPlaying && !isPaused ? '播放中...' : '播放完整序列'}
            </button>

            {isPlaying && (
              <button
                onClick={handleTogglePause}
                style={{
                  padding: '10px',
                  backgroundColor: isPaused ? '#4CAF50' : '#FF9800',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {isPaused ? '继续' : '暂停'}
              </button>
            )}

            <button
              onClick={handleReset}
              style={{
                padding: '10px',
                backgroundColor: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              重置
            </button>
          </div>

          {/* 结果面板 */}
          <ResultPanel
            matrixSequence={matrixSequence}
            vectorSet={vectorSet}
            currentMatrix={currentMatrix}
          />
        </div>
      </ResizableSidebar>

      <CanvasView
        ref={canvasViewRef}
        onAnimationComplete={handleAnimationComplete}
        onPlayStateChange={handlePlayStateChange}
        onCurrentMatrixChange={handleCurrentMatrixChange}
        onStepChange={handleStepChange}
        vectorSet={vectorSet}
        transformedGridOpacity={transformedGridOpacity}
      />
    </div>
  );
}

export default App;
