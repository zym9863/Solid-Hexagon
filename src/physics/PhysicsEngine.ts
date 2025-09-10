/**
 * 物理引擎核心类
 * 处理小球的运动、重力、摩擦力和碰撞反弹
 */
import { Vector2D } from './Vector2D';
import { circleHexagonCollision, rotateHexagon } from '../utils/hexagon';
import type { Hexagon, HexagonEdge } from '../utils/hexagon';

export interface PhysicsConfig {
  gravity: number;           // 重力加速度
  friction: number;          // 摩擦系数
  restitution: number;       // 恢复系数（弹性）
  rotationSpeed: number;     // 六边形旋转速度
  ballRadius: number;        // 小球半径
  maxVelocity: number;       // 最大速度限制
}

export interface BallState {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
}

export class PhysicsEngine {
  private config: PhysicsConfig;
  private ballState: BallState;
  private hexagon: Hexagon;
  private isRunning: boolean = false;

  constructor(config: PhysicsConfig, hexagon: Hexagon) {
    this.config = { ...config };
    this.hexagon = hexagon;
    
    // 初始化小球状态
    this.ballState = {
      position: new Vector2D(hexagon.center.x, hexagon.center.y),
      velocity: new Vector2D(
        (Math.random() - 0.5) * 200,  // 随机初始速度
        (Math.random() - 0.5) * 200
      ),
      acceleration: new Vector2D(0, 0)
    };
  }

  /**
   * 更新物理模拟
   */
  update(deltaTime: number): void {
    if (!this.isRunning) return;

    // 限制deltaTime避免物理不稳定
    deltaTime = Math.min(deltaTime, 0.016); // 最大16ms

    // 1. 应用重力
    this.applyGravity();
    
    // 2. 应用摩擦力
    this.applyFriction(deltaTime);
    
    // 3. 更新速度
    this.updateVelocity(deltaTime);
    
    // 4. 限制最大速度
    this.limitVelocity();
    
    // 5. 更新位置
    this.updatePosition(deltaTime);
    
    // 6. 处理碰撞
    this.handleCollisions();
    
    // 7. 更新六边形旋转
    this.updateHexagonRotation(deltaTime);
  }

  /**
   * 应用重力
   */
  private applyGravity(): void {
    this.ballState.acceleration.y += this.config.gravity;
  }

  /**
   * 应用摩擦力
   */
  private applyFriction(deltaTime: number): void {
    const frictionForce = this.config.friction * deltaTime;
    
    // 应用空气阻力（与速度成正比）
    this.ballState.velocity.x *= (1 - frictionForce);
    this.ballState.velocity.y *= (1 - frictionForce);
  }

  /**
   * 更新速度
   */
  private updateVelocity(deltaTime: number): void {
    this.ballState.velocity.x += this.ballState.acceleration.x * deltaTime;
    this.ballState.velocity.y += this.ballState.acceleration.y * deltaTime;
    
    // 重置加速度
    this.ballState.acceleration.set(0, 0);
  }

  /**
   * 限制最大速度
   */
  private limitVelocity(): void {
    const speed = this.ballState.velocity.magnitude();
    
    if (speed > this.config.maxVelocity) {
      const scale = this.config.maxVelocity / speed;
      this.ballState.velocity.x *= scale;
      this.ballState.velocity.y *= scale;
    }
  }

  /**
   * 更新位置
   */
  private updatePosition(deltaTime: number): void {
    this.ballState.position.x += this.ballState.velocity.x * deltaTime;
    this.ballState.position.y += this.ballState.velocity.y * deltaTime;
  }

  /**
   * 处理碰撞
   */
  private handleCollisions(): void {
    const collision = circleHexagonCollision(
      this.ballState.position,
      this.config.ballRadius,
      this.hexagon
    );

    if (collision.isColliding && collision.collisionEdge && collision.collisionPoint) {
      this.resolveCollision(collision.collisionEdge, collision.penetrationDepth || 0);
    }
  }

  /**
   * 解决碰撞
   */
  private resolveCollision(edge: HexagonEdge, penetrationDepth: number): void {
    // 1. 分离小球避免重叠
    const separationVector = edge.normal.multiply(penetrationDepth);
    this.ballState.position = this.ballState.position.add(separationVector);

    // 2. 计算反射速度
    const incidentVelocity = this.ballState.velocity;
    const normal = edge.normal;
    
    // 使用弹性碰撞公式: v' = v - 2(v·n)n
    const dotProduct = incidentVelocity.dot(normal);
    const reflectedVelocity = new Vector2D(
      incidentVelocity.x - 2 * dotProduct * normal.x * this.config.restitution,
      incidentVelocity.y - 2 * dotProduct * normal.y * this.config.restitution
    );

    // 3. 应用反射速度
    this.ballState.velocity = reflectedVelocity;

    // 4. 添加一些随机性避免无限循环反弹
    if (Math.abs(this.ballState.velocity.x) < 10 && Math.abs(this.ballState.velocity.y) < 10) {
      this.ballState.velocity.x += (Math.random() - 0.5) * 50;
      this.ballState.velocity.y += (Math.random() - 0.5) * 50;
    }
  }

  /**
   * 更新六边形旋转
   */
  private updateHexagonRotation(deltaTime: number): void {
    this.hexagon = rotateHexagon(this.hexagon, this.config.rotationSpeed * deltaTime);
  }

  /**
   * 开始物理模拟
   */
  start(): void {
    this.isRunning = true;
  }

  /**
   * 停止物理模拟
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * 重置小球状态
   */
  reset(): void {
    this.ballState.position.set(this.hexagon.center.x, this.hexagon.center.y);
    this.ballState.velocity.set(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 200
    );
    this.ballState.acceleration.set(0, 0);
  }

  /**
   * 获取当前状态
   */
  getState(): BallState {
    return {
      position: this.ballState.position.clone(),
      velocity: this.ballState.velocity.clone(),
      acceleration: this.ballState.acceleration.clone()
    };
  }

  /**
   * 获取六边形
   */
  getHexagon(): Hexagon {
    return this.hexagon;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取配置
   */
  getConfig(): PhysicsConfig {
    return { ...this.config };
  }

  /**
   * 设置小球位置
   */
  setBallPosition(position: Vector2D): void {
    this.ballState.position = position.clone();
  }

  /**
   * 设置小球速度
   */
  setBallVelocity(velocity: Vector2D): void {
    this.ballState.velocity = velocity.clone();
  }

  /**
   * 获取动能
   */
  getKineticEnergy(): number {
    const speed = this.ballState.velocity.magnitude();
    return 0.5 * speed * speed; // 假设质量为1
  }

  /**
   * 获取速度
   */
  getVelocity(): number {
    return this.ballState.velocity.magnitude();
  }
}