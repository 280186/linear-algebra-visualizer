import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';

const EPS = 1e-8;

/**
 * 构造基矩阵 P = [b1 b2]
 * b1 是第一列，b2 是第二列
 */
export function buildBasisMatrix(b1: Vec2, b2: Vec2): Mat2 {
  return new Mat2(b1.x, b2.x, b1.y, b2.y);
}

/**
 * 判断是否构成有效基（P 可逆）
 */
export function isValidBasis(P: Mat2): boolean {
  return Math.abs(P.determinant()) >= EPS;
}

/**
 * 标准坐标 → 新基坐标
 * [x]_B = P^{-1} x
 * 如果 P 不可逆，返回 null
 */
export function standardToBasisCoordinates(x: Vec2, P: Mat2): Vec2 | null {
  const inverse = P.inverse();
  if (!inverse) return null;
  return inverse.multiplyVec(x);
}

/**
 * 新基坐标 → 标准坐标
 * x = P [v]_B
 */
export function basisToStandardCoordinates(coord: Vec2, P: Mat2): Vec2 {
  return P.multiplyVec(coord);
}

/**
 * 格式化标量值，避免 -0.00、NaN、Infinity
 */
export function formatScalar(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) < EPS) return '0';
  return Math.abs(value).toFixed(2);
}

/**
 * 格式化矩阵元素
 */
export function formatElement(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) < EPS) return '0';
  return value.toFixed(2);
}

/**
 * 计算线性变换在新基下的矩阵表示
 * A_B = P^{-1} A P
 * 如果 P 不可逆，返回 null
 */
export function computeTransformInBasis(A: Mat2, P: Mat2): Mat2 | null {
  const PInverse = P.inverse();
  if (!PInverse) return null;

  // A_B = P^{-1} * A * P
  return PInverse.multiplyMat(A).multiplyMat(P);
}
