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
}
