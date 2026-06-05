/**
 * Vec2 - 二维向量类
 * 使用列向量约定：v = [x, y]^T
 */
export class Vec2 {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /** 向量加法 */
  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  /** 向量减法 */
  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  /** 标量乘法 */
  scale(k: number): Vec2 {
    return new Vec2(this.x * k, this.y * k);
  }

  /** 点积 */
  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }

  /** 向量长度 */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** 单位化向量 */
  normalized(): Vec2 {
    const len = this.length();
    if (len === 0) return new Vec2(0, 0);
    return new Vec2(this.x / len, this.y / len);
  }

  /** 克隆 */
  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  /** 转换为数组 [x, y] */
  toArray(): [number, number] {
    return [this.x, this.y];
  }

  /** 静态方法：创建零向量 */
  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  /** 静态方法：从数组创建 */
  static fromArray(arr: [number, number]): Vec2 {
    return new Vec2(arr[0], arr[1]);
  }
}
