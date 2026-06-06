import { Mat2 } from '../math/Mat2';
import { Vec2 } from '../math/Vec2';
import { EigenResult, EigenDirectionResult } from '../types';

const EPS = 1e-8;

/**
 * 对 2x2 矩阵做特征值 / 特征方向分析
 * 只返回实特征值和实特征方向
 */
export function analyzeEigenvalues(A: Mat2): EigenResult {
  const trace = A.a + A.d;
  const det = A.a * A.d - A.b * A.c;
  const discriminant = trace * trace - 4 * det;

  // 无实特征值
  if (discriminant < -EPS) {
    return {
      kind: 'no-real-eigenvalues',
      directions: [],
      trace,
      discriminant,
    };
  }

  // 重特征值
  if (Math.abs(discriminant) <= EPS) {
    const lambda = trace / 2;
    const M = new Mat2(A.a - lambda, A.b, A.c, A.d - lambda);
    const result = findNullSpaceDirection(M);

    if (result === null || result.normalized === null) {
      // A ≈ λI，所有方向都是特征方向
      return {
        kind: 'all-directions',
        directions: [{ id: 'all', lambda, direction: null, displayDirection: null }],
        trace,
        discriminant,
      };
    }

    // 只有一条特征方向
    return {
      kind: 'one-real-direction',
      directions: [{
        id: 'eigen-0',
        lambda,
        direction: [result.normalized.x, result.normalized.y],
        displayDirection: [result.raw.x, result.raw.y],
      }],
      trace,
      discriminant,
    };
  }

  // 两个不同实特征值
  const sqrtD = Math.sqrt(discriminant);
  const lambda1 = (trace + sqrtD) / 2;
  const lambda2 = (trace - sqrtD) / 2;

  const r1 = findEigenDirection(A, lambda1);
  const r2 = findEigenDirection(A, lambda2);

  const directions: EigenDirectionResult[] = [];

  if (r1) {
    directions.push({
      id: 'eigen-0',
      lambda: lambda1,
      direction: [r1.normalized.x, r1.normalized.y],
      displayDirection: [r1.raw.x, r1.raw.y],
    });
  }
  if (r2) {
    // 去重：检查 dir2 是否与已有方向共线
    const isDuplicate = directions.some(d => {
      if (!d.direction || !r2) return false;
      const existing = new Vec2(d.direction[0], d.direction[1]);
      return Math.abs(existing.dot(r2.normalized)) > 1 - 1e-6;
    });
    if (!isDuplicate) {
      directions.push({
        id: 'eigen-1',
        lambda: lambda2,
        direction: [r2.normalized.x, r2.normalized.y],
        displayDirection: [r2.raw.x, r2.raw.y],
      });
    }
  }

  return {
    kind: directions.length === 2 ? 'two-real' : 'one-real-direction',
    directions,
    trace,
    discriminant,
  };
}

/** findNullSpaceDirection 的返回值 */
interface NullSpaceResult {
  /** 归一化方向（Canvas 绘制用） */
  normalized: Vec2;
  /** 原始方向（显示用，尽量保留整数） */
  raw: Vec2;
}

/**
 * 求 (A - λI) 的零空间方向
 * 返回归一化方向和原始方向，如果零空间是全平面返回 null
 */
function findEigenDirection(A: Mat2, lambda: number): NullSpaceResult | null {
  const M = new Mat2(A.a - lambda, A.b, A.c, A.d - lambda);
  return findNullSpaceDirection(M);
}

/**
 * 求 2x2 矩阵 M 的零空间方向
 * 返回 { normalized, raw } 或 null
 */
function findNullSpaceDirection(M: Mat2): NullSpaceResult | null {
  const row0 = new Vec2(M.a, M.b);
  const row1 = new Vec2(M.c, M.d);
  const len0 = row0.length();
  const len1 = row1.length();

  // 选择范数较大的行以提高数值稳定性
  let row: Vec2;
  if (len0 >= len1) {
    row = row0;
  } else {
    row = row1;
  }

  // 两行都近似零 → 零空间是全平面
  if (len0 < EPS && len1 < EPS) {
    return null;
  }

  // 行向量 [p, q]，零空间方向为 (-q, p)
  const rawDir = new Vec2(-row.y, row.x);
  const dirLen = rawDir.length();

  if (dirLen < EPS) {
    return null;
  }

  // 符号规范化（使第一个非零分量为正，避免 u/-u 重复）
  const signNorm = normalizeDirectionSign(rawDir);

  // 归一化版本（Canvas 绘制用）
  const normalized = signNorm.scale(1 / dirLen);

  // 原始版本（显示用）：尝试简化为整数
  const raw = simplifyToIntegers(signNorm);

  return { normalized, raw };
}

/**
 * 方向符号规范化：使第一个非零分量为正
 * 这样 u 和 -u 会被规范化为同一个方向
 */
function normalizeDirectionSign(v: Vec2): Vec2 {
  if (v.x > EPS) return v;
  if (v.x < -EPS) return v.scale(-1);
  // x ≈ 0，看 y
  if (v.y > EPS) return v;
  if (v.y < -EPS) return v.scale(-1);
  return v;
}

/**
 * 尝试将向量简化为整数形式
 * 例如 (2.000, 2.000) → (1, 1)，(3.000, 0.000) → (1, 0)
 * 如果无法简化为整数，返回原始值
 */
function simplifyToIntegers(v: Vec2): Vec2 {
  const rx = Math.round(v.x);
  const ry = Math.round(v.y);

  // 检查是否接近整数
  if (Math.abs(v.x - rx) < 1e-6 && Math.abs(v.y - ry) < 1e-6) {
    if (rx === 0 && ry === 0) return v;
    // 求最大公约数，简化
    const g = gcd(Math.abs(rx), Math.abs(ry));
    return new Vec2(rx / g, ry / g);
  }

  // 非整数，返回原始值
  return v;
}

/** 求最大公约数 */
function gcd(a: number, b: number): number {
  a = Math.round(a);
  b = Math.round(b);
  if (a === 0) return b || 1;
  if (b === 0) return a || 1;
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/**
 * 获取特征方向的几何意义描述
 */
export function getEigenMeaning(lambda: number): string {
  if (Math.abs(lambda) < EPS) return '压缩到零向量';
  if (Math.abs(lambda - 1) < EPS) return '方向保持，长度不变';
  if (Math.abs(lambda + 1) < EPS) return '方向反向，长度不变';
  if (lambda > 1) return '方向保持，长度放大';
  if (lambda > 0) return '方向保持，长度缩小';
  if (lambda < -1) return '方向反向，长度放大';
  return '方向反向，长度缩小';
}
