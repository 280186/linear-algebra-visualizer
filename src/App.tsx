import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { CanvasView, CanvasViewHandle } from './components/CanvasView';
import { ResizableSidebar } from './components/ResizableSidebar';
import { MatrixList } from './components/MatrixList';
import { VectorList } from './components/VectorList';
import { ResultPanel } from './components/ResultPanel';
import { BasisPanel } from './components/BasisPanel';
import { PathPanel } from './components/PathPanel';
import { EigenPanel } from './components/EigenPanel';
import { Mat2 } from './math/Mat2';
import { Vec2 } from './math/Vec2';
import { MatrixItem, VectorItem, BasisConfig, PathDemoState, EigenConfig } from './types';
import { generateId } from './utils/id';
import { computeCumulativeMatrices } from './utils/matrixSequence';
import { buildBasisMatrix, standardToBasisCoordinates } from './utils/basis';
import { analyzeEigenvalues } from './utils/eigen';
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

  // 新基网格强度
  const [basisGridOpacity, setBasisGridOpacity] = useState(0.4);

  // 基与坐标配置（默认关闭）
  const [basisConfig, setBasisConfig] = useState<BasisConfig>({
    b1: [1, 0],
    b2: [0, 1],
    showBasisCoordinateInfo: false
  });

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

  // 路径演示状态（overlay，不影响全局变换）
  const [pathDemo, setPathDemo] = useState<PathDemoState>({
    selectedVectorId: null,
    stepIndex: 0,
    isPlaying: false,
    overlayProgress: 0,
  });

  // 路径动画是否激活（包括自动播放和单步动画）
  const [isPathAnimating, setIsPathAnimating] = useState(false);

  // 特征信息配置
  const [eigenConfig, setEigenConfig] = useState<EigenConfig>({
    showEigenInfo: false,
    selectedDirectionId: null,
    scalarT: 1,
  });

  // CanvasView ref
  const canvasViewRef = useRef<CanvasViewHandle>(null);

  // 计算累计矩阵
  const cumulativeMatrices = useMemo(() => {
    return computeCumulativeMatrices(matrixSequence);
  }, [matrixSequence]);

  // finalMatrix
  const finalMatrix = cumulativeMatrices[cumulativeMatrices.length - 1] || Mat2.identity();

  // 特征分析结果（从 finalMatrix 派生，不存 state）
  const eigenResult = useMemo(() => {
    return analyzeEigenvalues(finalMatrix);
  }, [finalMatrix]);

  // 当 finalMatrix 变化时，自动修正 selectedDirectionId
  useEffect(() => {
    if (!eigenConfig.showEigenInfo) return;
    const exists = eigenResult.directions.some(d => d.id === eigenConfig.selectedDirectionId);
    if (!exists) {
      setEigenConfig(prev => ({
        ...prev,
        selectedDirectionId: eigenResult.directions[0]?.id || null,
      }));
    }
  }, [eigenResult, eigenConfig.showEigenInfo, eigenConfig.selectedDirectionId]);

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

  // 添加向量（新增向量默认不显示数值标签，默认标准坐标主控）
  const handleAddVector = useCallback(() => {
    if (vectorSet.length >= 8) return;
    setVectorSet(prev => [
      ...prev,
      {
        id: generateId(),
        name: `v${prev.length + 1}`,
        vector: [1, 0],
        showValueLabel: false,
        controlMode: 'standard',
        basisCoord: [1, 0]
      }
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

  // 修改标准坐标（主控模式设为 'standard'，同时更新 basisCoord）
  const handleStandardChange = useCallback((id: string, vector: [number, number]) => {
    setVectorSet(prev => prev.map(item => {
      if (item.id !== id) return item;

      // 计算新的 basisCoord
      const vec = new Vec2(vector[0], vector[1]);
      const b1 = new Vec2(basisConfig.b1[0], basisConfig.b1[1]);
      const b2 = new Vec2(basisConfig.b2[0], basisConfig.b2[1]);
      const P = buildBasisMatrix(b1, b2);
      const basisCoordResult = standardToBasisCoordinates(vec, P);
      const newBasisCoord = basisCoordResult
        ? [basisCoordResult.x, basisCoordResult.y] as [number, number]
        : item.basisCoord ?? [0, 0];

      return {
        ...item,
        vector,
        controlMode: 'standard' as const,
        basisCoord: newBasisCoord
      };
    }));
  }, [basisConfig]);

  // 修改新基坐标（主控模式设为 'basis'，同时更新标准坐标）
  const handleBasisChange = useCallback((id: string, basisCoord: [number, number]) => {
    setVectorSet(prev => prev.map(item => {
      if (item.id !== id) return item;

      // 计算新的标准坐标 v = P [v]_B
      const b1 = new Vec2(basisConfig.b1[0], basisConfig.b1[1]);
      const b2 = new Vec2(basisConfig.b2[0], basisConfig.b2[1]);
      const P = buildBasisMatrix(b1, b2);
      const coordVec = new Vec2(basisCoord[0], basisCoord[1]);
      const standardVec = P.multiplyVec(coordVec);
      const newVector = [standardVec.x, standardVec.y] as [number, number];

      return {
        ...item,
        vector: newVector,
        controlMode: 'basis' as const,
        basisCoord
      };
    }));
  }, [basisConfig]);

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

  // 播放逆变换
  const handlePlayInverse = useCallback(() => {
    if (!canvasViewRef.current) return;

    setIsPlaying(true);
    setIsPaused(false);

    canvasViewRef.current.playInverse();
  }, []);

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

  // 路径演示：重置（当 basisConfig/matrixSequence/finalMatrix/vectorSet 变化时调用）
  const resetPathDemo = useCallback(() => {
    if (canvasViewRef.current) {
      canvasViewRef.current.stopPathAnimation();
    }
    setPathDemo({
      selectedVectorId: null,
      stepIndex: 0,
      isPlaying: false,
      overlayProgress: 0,
    });
    setIsPathAnimating(false);
  }, []);

  // 当 basisConfig/matrixSequence/vectorSet 变化时，重置路径演示
  const prevBasisRef = useRef(basisConfig);
  const prevMatrixSeqRef = useRef(matrixSequence);
  const prevVectorSetRef = useRef(vectorSet);

  useEffect(() => {
    const basisChanged =
      prevBasisRef.current.b1[0] !== basisConfig.b1[0] ||
      prevBasisRef.current.b1[1] !== basisConfig.b1[1] ||
      prevBasisRef.current.b2[0] !== basisConfig.b2[0] ||
      prevBasisRef.current.b2[1] !== basisConfig.b2[1] ||
      prevBasisRef.current.showBasisCoordinateInfo !== basisConfig.showBasisCoordinateInfo;
    const matrixChanged = prevMatrixSeqRef.current !== matrixSequence;
    const vectorChanged = prevVectorSetRef.current !== vectorSet;

    if (basisChanged || matrixChanged || vectorChanged) {
      resetPathDemo();
    }

    prevBasisRef.current = basisConfig;
    prevMatrixSeqRef.current = matrixSequence;
    prevVectorSetRef.current = vectorSet;
  }, [basisConfig, matrixSequence, vectorSet, resetPathDemo]);

  // 路径演示：选择向量
  const handlePathSelectVector = useCallback((id: string) => {
    resetPathDemo();
    setPathDemo(prev => ({ ...prev, selectedVectorId: id }));
  }, [resetPathDemo]);

  // 路径演示：上一步
  const handlePathPrevStep = useCallback(() => {
    if (!canvasViewRef.current) return;
    setPathDemo(prev => {
      if (prev.stepIndex <= 0) return prev;
      const newStep = prev.stepIndex - 1;
      canvasViewRef.current!.setPathStep(newStep);
      return { ...prev, stepIndex: newStep, overlayProgress: 0 };
    });
  }, []);

  // 路径演示：下一步
  const handlePathNextStep = useCallback(() => {
    if (!canvasViewRef.current) return;
    setPathDemo(prev => {
      if (prev.stepIndex >= 4) return prev;
      const newStep = prev.stepIndex + 1;
      if (newStep === 2) {
        // step 2: 触发动画 v_E → Av_E
        setIsPathAnimating(true);
        canvasViewRef.current!.stepPathAnimation(() => {
          setIsPathAnimating(false);
          setPathDemo(p => ({ ...p, overlayProgress: 1 }));
        });
      } else {
        canvasViewRef.current!.setPathStep(newStep);
      }
      return { ...prev, stepIndex: newStep, overlayProgress: newStep === 2 ? 0 : 0 };
    });
  }, []);

  // 路径演示：播放完整路径
  const handlePlayPath = useCallback(() => {
    if (!canvasViewRef.current) return;
    const selectedId = pathDemo.selectedVectorId || vectorSet[0]?.id;
    if (!selectedId) return;

    setPathDemo({
      selectedVectorId: selectedId,
      stepIndex: 0,
      isPlaying: true,
      overlayProgress: 0,
    });
    setIsPathAnimating(true);

    // 自动播放序列：step 0 → 1 → 2(动画) → 3 → 4
    const delays = [600, 600, 0, 600, 600]; // step 2 由动画控制时长
    let currentStep = 0;

    const advanceStep = () => {
      currentStep++;
      if (currentStep > 4) {
        // 播放完成
        setPathDemo(prev => ({ ...prev, isPlaying: false }));
        setIsPathAnimating(false);
        return;
      }

      if (currentStep === 2) {
        // step 2: 触发动画
        setPathDemo(prev => ({ ...prev, stepIndex: 2, overlayProgress: 0 }));
        canvasViewRef.current!.stepPathAnimation(() => {
          setPathDemo(prev => ({ ...prev, overlayProgress: 1 }));
          // 动画完成后继续下一步
          setTimeout(advanceStep, delays[3]);
        });
        return;
      }

      setPathDemo(prev => ({ ...prev, stepIndex: currentStep, overlayProgress: 0 }));
      canvasViewRef.current!.setPathStep(currentStep);
      setTimeout(advanceStep, delays[currentStep]);
    };

    canvasViewRef.current.setPathStep(0);
    setTimeout(advanceStep, delays[0]);
  }, [pathDemo.selectedVectorId, vectorSet]);

  // 路径演示：重置
  const handleResetPath = useCallback(() => {
    resetPathDemo();
  }, [resetPathDemo]);

  // 计算按钮禁用状态（路径动画和矩阵动画互斥）
  const matrixAnimActive = isPlaying && !isPaused;
  const canStepForward = currentStepIndex < matrixSequence.length && !isPlaying && !isPathAnimating;
  const canStepBackward = currentStepIndex > 0 && !isPlaying && !isPathAnimating;

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
            disabled={matrixAnimActive || isPathAnimating}
          />

          {/* 用户向量 */}
          <VectorList
            items={vectorSet}
            onAdd={handleAddVector}
            onRemove={handleRemoveVector}
            onChange={handleVectorChange}
            onChangeShowLabel={handleChangeShowLabel}
            onStandardChange={handleStandardChange}
            onBasisChange={handleBasisChange}
            basisConfig={basisConfig}
            disabled={matrixAnimActive || isPathAnimating}
          />

          {/* 基与坐标 */}
          <BasisPanel
            config={basisConfig}
            onChange={setBasisConfig}
            disabled={matrixAnimActive || isPathAnimating}
          />

          {/* P^{-1}AP 路径演示 */}
          <PathPanel
            pathDemo={pathDemo}
            vectorSet={vectorSet}
            basisConfig={basisConfig}
            finalMatrix={finalMatrix}
            disabled={matrixAnimActive}
            onSelectVector={handlePathSelectVector}
            onPrevStep={handlePathPrevStep}
            onNextStep={handlePathNextStep}
            onPlayPath={handlePlayPath}
            onResetPath={handleResetPath}
          />

          {/* 特征值 / 特征向量 */}
          <EigenPanel
            eigenConfig={eigenConfig}
            eigenResult={eigenResult}
            onConfigChange={setEigenConfig}
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
            <div style={{ marginBottom: '8px' }}>
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
            <div>
              <label style={{ fontSize: '12px', color: '#888' }}>
                新基网格强度：{basisGridOpacity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={basisGridOpacity}
                onChange={(e) => setBasisGridOpacity(parseFloat(e.target.value))}
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
              disabled={matrixAnimActive || isPathAnimating}
              style={{
                padding: '10px',
                backgroundColor: (matrixAnimActive || isPathAnimating) ? '#555' : '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: (matrixAnimActive || isPathAnimating) ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {matrixAnimActive ? '播放中...' : '播放完整序列'}
            </button>

            {/* 播放逆变换按钮 */}
            {(() => {
              const canPlayInverse = currentMatrix && Math.abs(currentMatrix.determinant()) >= 1e-8 && !isPlaying && !isPathAnimating;
              return (
                <button
                  onClick={handlePlayInverse}
                  disabled={!canPlayInverse}
                  style={{
                    padding: '10px',
                    backgroundColor: canPlayInverse ? '#E91E63' : '#555',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: canPlayInverse ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                  title={currentMatrix && Math.abs(currentMatrix.determinant()) < 1e-8 ? '当前矩阵不可逆，无法播放逆变换' : ''}
                >
                  播放逆变换 (C → I)
                </button>
              );
            })()}

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
            basisConfig={basisConfig}
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
        basisGridOpacity={basisGridOpacity}
        basisConfig={basisConfig}
        pathDemoState={pathDemo}
        finalMatrix={finalMatrix}
        eigenConfig={eigenConfig}
        eigenResult={eigenResult}
      />
    </div>
  );
}

export default App;
