/**
 * 矩阵序列项
 */
export interface MatrixItem {
  id: string;
  name: string;
  matrix: [[number, number], [number, number]];
}

/**
 * 向量集合项
 */
export interface VectorItem {
  id: string;
  name: string;
  vector: [number, number];
  /** 是否在 Canvas 中显示数值标签 */
  showValueLabel?: boolean;
  /** 主控模式：'standard' = 标准坐标固定，'basis' = 新基坐标固定 */
  controlMode?: 'standard' | 'basis';
  /** 新基坐标 [v]_B（当 controlMode='basis' 时固定） */
  basisCoord?: [number, number];
}

/**
 * 基与坐标配置
 */
export interface BasisConfig {
  /** 基向量 b1 */
  b1: [number, number];
  /** 基向量 b2 */
  b2: [number, number];
  /** 是否显示基与坐标信息（总开关） */
  showBasisCoordinateInfo: boolean;
}

/**
 * P^{-1}AP 路径演示状态（overlay，不影响全局变换状态）
 */
export interface PathDemoState {
  /** 选中的用户向量 ID */
  selectedVectorId: string | null;
  /** 当前步骤 0~4 */
  stepIndex: number;
  /** 是否正在自动播放完整路径 */
  isPlaying: boolean;
  /** step 2 动画进度 0~1（仅 step 2 有效） */
  overlayProgress: number;
}

/**
 * 特征方向（用于 EigenResult 返回值）
 * direction 使用 Vec2（utils 内部计算用），进入 React state 时转为 [number, number]
 */
export interface EigenDirectionResult {
  id: string;
  lambda: number;
  /** 归一化特征方向（Canvas 绘制用），null 表示所有方向都是特征方向 */
  direction: [number, number] | null;
  /** 显示用方向（尽量保留整数，如 (1,1) 而非 (0.71,0.71)），null 表示所有方向 */
  displayDirection: [number, number] | null;
}

/**
 * 特征分析结果
 */
export interface EigenResult {
  kind: 'two-real' | 'one-real-direction' | 'all-directions' | 'no-real-eigenvalues';
  directions: EigenDirectionResult[];
  trace: number;
  discriminant: number;
}

/**
 * 特征信息 UI 配置
 */
export interface EigenConfig {
  showEigenInfo: boolean;
  selectedDirectionId: string | null;
  scalarT: number;
}
