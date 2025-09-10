/**
 * 二维向量类，用于处理位置、速度、力等物理计算
 */
export class Vector2D {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * 向量加法
   */
  add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  /**
   * 向量减法
   */
  subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  /**
   * 向量数乘
   */
  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  /**
   * 向量数除
   */
  divide(scalar: number): Vector2D {
    return new Vector2D(this.x / scalar, this.y / scalar);
  }

  /**
   * 向量点积
   */
  dot(other: Vector2D): number {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * 向量长度
   */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 向量长度的平方（避免开方运算，性能优化）
   */
  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * 单位向量
   */
  normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2D(0, 0);
    return this.divide(mag);
  }

  /**
   * 向量复制
   */
  clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  /**
   * 设置向量值
   */
  set(x: number, y: number): Vector2D {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * 向量距离
   */
  distance(other: Vector2D): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 向量旋转
   */
  rotate(angle: number): Vector2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  /**
   * 向量反射
   */
  reflect(normal: Vector2D): Vector2D {
    const dotProduct = this.dot(normal);
    return new Vector2D(
      this.x - 2 * dotProduct * normal.x,
      this.y - 2 * dotProduct * normal.y
    );
  }

  /**
   * 字符串表示
   */
  toString(): string {
    return `Vector2D(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}