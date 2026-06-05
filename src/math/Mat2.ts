import { Vec2 } from './Vec2';

const EPS = 1e-8;

/**
 * Mat2 - 二维矩阵类
 * 列向量约定：
 *   A = [ a b ]
 *       [ c d ]
 * 第一列 = (a, c) = e1 变换后的位置
 * 第二列 = (b, d) = e2 变换后的位置
 */
export class Mat2 {
  public a: number;
  public b: number;
  public c: number;
  public d: number;

  constructor(a: number, b: number, c: number, d: number) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }

  /**
   * 矩阵作用于向量 v' = A v
   * 结果：x' = a*x + b*y, y' = c*x + d*y
   */
  multiplyVec(v: Vec2): Vec2 {
    return new Vec2(
      this.a * v.x + this.b * v.y,
      this.c * v.x + this.d * v.y
    );
  }

  /**
   * 矩阵乘法 C = A * B
   * 语义：先执行 B，再执行 A（如果用于组合变换）
   */
  multiplyMat(m: Mat2): Mat2 {
    return new Mat2(
      this.a * m.a + this.b * m.c,
      this.a * m.b + this.b * m.d,
      this.c * m.a + this.d * m.c,
      this.c * m.b + this.d * m.d
    );
  }

  /** 行列式 det(A) = ad - bc */
  determinant(): number {
    return this.a * this.d - this.b * this.c;
  }

  /** 逆矩阵，如果不可逆返回 null */
  inverse(): Mat2 | null {
    const det = this.determinant();
    if (Math.abs(det) < EPS) return null;
    const invDet = 1 / det;
    return new Mat2(
      this.d * invDet,
      -this.b * invDet,
      -this.c * invDet,
      this.a * invDet
    );
  }

  /** 转置 */
  transpose(): Mat2 {
    return new Mat2(this.a, this.c, this.b, this.d);
  }

  /**
   * 线性插值到目标矩阵
   * M(t) = (1 - t) * this + t * to
   * 主要用于动画：从 I 插值到 A
   */
  lerp(to: Mat2, t: number): Mat2 {
    return new Mat2(
      (1 - t) * this.a + t * to.a,
      (1 - t) * this.b + t * to.b,
      (1 - t) * this.c + t * to.c,
      (1 - t) * this.d + t * to.d
    );
  }

  /** 克隆 */
  clone(): Mat2 {
    return new Mat2(this.a, this.b, this.c, this.d);
  }

  /** 转换为二维数组 [[a,b],[c,d]] */
  toMatrix(): [[number, number], [number, number]] {
    return [[this.a, this.b], [this.c, this.d]];
  }

  /** 获取第一列（e1 变换后的位置） */
  col1(): Vec2 {
    return new Vec2(this.a, this.c);
  }

  /** 获取第二列（e2 变换后的位置） */
  col2(): Vec2 {
    return new Vec2(this.b, this.d);
  }

  // ---- 静态工厂方法 ----

  /** 单位矩阵 */
  static identity(): Mat2 {
    return new Mat2(1, 0, 0, 1);
  }

  /** 旋转矩阵（逆时针 theta 弧度） */
  static rotation(theta: number): Mat2 {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return new Mat2(cos, -sin, sin, cos);
  }

  /** 缩放矩阵 */
  static scale(sx: number, sy: number): Mat2 {
    return new Mat2(sx, 0, 0, sy);
  }

  /** 剪切矩阵 */
  static shear(kx: number, ky: number): Mat2 {
    return new Mat2(1, kx, ky, 1);
  }

  /** 从二维数组创建 */
  static fromMatrix(m: [[number, number], [number, number]]): Mat2 {
    return new Mat2(m[0][0], m[0][1], m[1][0], m[1][1]);
  }
}
