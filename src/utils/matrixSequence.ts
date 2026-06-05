import { Mat2 } from '../math/Mat2';
import { Vec2 } from '../math/Vec2';
import { MatrixItem, VectorItem } from '../types';

/**
 * 将 MatrixItem 的 matrix 转换为 Mat2
 */
export function matrixArrayToMat2(matrix: [[number, number], [number, number]]): Mat2 {
  return Mat2.fromMatrix(matrix);
}

/**
 * 将 Mat2 转换为 MatrixItem 的 matrix 格式
 */
export function mat2ToMatrixArray(mat: Mat2): [[number, number], [number, number]] {
  return mat.toMatrix();
}

/**
 * 计算每一步的累计矩阵
 *
 * 规则：A1, A2, A3, ..., An
 * C0 = I
 * C1 = A1
 * C2 = A2 * A1
 * C3 = A3 * A2 * A1
 * ...
 */
export function computeCumulativeMatrices(sequence: MatrixItem[]): Mat2[] {
  const result: Mat2[] = [Mat2.identity()]; // C0 = I

  let current = Mat2.identity();
  for (const item of sequence) {
    const m = matrixArrayToMat2(item.matrix);
    current = m.multiplyMat(current); // 先执行的在右边
    result.push(current.clone());
  }

  return result;
}

/**
 * 计算最终累计矩阵
 */
export function computeFinalMatrix(sequence: MatrixItem[]): Mat2 {
  const cumulative = computeCumulativeMatrices(sequence);
  return cumulative[cumulative.length - 1];
}

/**
 * 计算用户向量的变换结果
 */
export function computeTransformedVectors(
  finalMatrix: Mat2,
  vectors: VectorItem[]
): Array<{ original: Vec2; transformed: Vec2; name: string }> {
  return vectors.map(v => {
    const original = new Vec2(v.vector[0], v.vector[1]);
    const transformed = finalMatrix.multiplyVec(original);
    return { original, transformed, name: v.name };
  });
}
