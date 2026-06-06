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
