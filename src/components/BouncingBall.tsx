/**
 * 旋转六边形内弹跳小球主组件
 * 包含Canvas渲染、物理模拟和动画循环
 */
import { createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import type { PhysicsConfig, BallState } from '../physics/PhysicsEngine';
import { Vector2D } from '../physics/Vector2D';
import { createHexagon } from '../utils/hexagon';
import type { Hexagon } from '../utils/hexagon';

interface BouncingBallProps {
  width?: number;
  height?: number;
  hexagonRadius?: number;
}

export default function BouncingBall(props: BouncingBallProps) {
  const {
    width = 800,
    height = 600,
    hexagonRadius = 200
  } = props;

  let canvasRef: HTMLCanvasElement | undefined;
  let animationId: number | null = null;
  let lastTime = 0;

  // 物理配置
  const [physicsConfig, setPhysicsConfig] = createSignal<PhysicsConfig>({
    gravity: 500,        // 重力加速度
    friction: 0.02,      // 摩擦系数
    restitution: 0.8,    // 恢复系数
    rotationSpeed: 1.0,  // 旋转速度
    ballRadius: 12,      // 小球半径
    maxVelocity: 800     // 最大速度
  });

  // 物理引擎
  const [physicsEngine, setPhysicsEngine] = createSignal<PhysicsEngine | null>(null);
  
  // 小球状态
  const [ballState, setBallState] = createSignal<BallState | null>(null);
  
  // 六边形状态
  const [hexagon, setHexagon] = createSignal<Hexagon | null>(null);
  
  // 控制状态
  const [isPlaying, setIsPlaying] = createSignal(true);
  const [showTrails, setShowTrails] = createSignal(true);
  const [kineticEnergy, setKineticEnergy] = createSignal(0);
  const [velocity, setVelocity] = createSignal(0);

  // 轨迹系统
  const [trails, setTrails] = createSignal<Vector2D[]>([]);
  const maxTrails = 50;

  // 粒子效果系统
  interface Particle {
    position: Vector2D;
    velocity: Vector2D;
    life: number;
    maxLife: number;
    size: number;
    color: string;
  }
  const [particles, setParticles] = createSignal<Particle[]>([]);

  // 碰撞效果
  const [collisionPoints, setCollisionPoints] = createSignal<{position: Vector2D, intensity: number, time: number}[]>([]);

  // 初始化物理引擎
  onMount(() => {
    const center = new Vector2D(width / 2, height / 2);
    const hex = createHexagon(center, hexagonRadius);
    const engine = new PhysicsEngine(physicsConfig(), hex);
    
    setPhysicsEngine(engine);
    setHexagon(hex);
    setBallState(engine.getState());
    
    engine.start();
    startAnimation();
  });

  // 清理资源
  onCleanup(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    physicsEngine()?.stop();
  });

  // 更新物理配置
  createEffect(() => {
    const engine = physicsEngine();
    if (engine) {
      engine.updateConfig(physicsConfig());
    }
  });

  /**
   * 动画循环
   */
  function animate(currentTime: number) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.016);
    lastTime = currentTime;

    const engine = physicsEngine();
    if (engine && isPlaying()) {
      engine.update(deltaTime);
      
      const state = engine.getState();
      setBallState(state);
      setHexagon(engine.getHexagon());
      setKineticEnergy(engine.getKineticEnergy());
      setVelocity(engine.getVelocity());

      // 更新轨迹
      if (showTrails()) {
        setTrails(prev => {
          const newTrails = [...prev, state.position.clone()];
          return newTrails.slice(-maxTrails);
        });
      }

      // 更新粒子效果
      updateParticles(deltaTime);

      // 检测碰撞并添加效果
      if (engine.hasCollisionThisFrame()) {
        addCollisionEffect(state.position, Math.min(engine.getVelocity() / 200, 1));
      }
    }

    // 渲染
    render();
    
    animationId = requestAnimationFrame(animate);
  }

  /**
   * 开始动画
   */
  function startAnimation() {
    lastTime = performance.now();
    animate(lastTime);
  }

  /**
   * 渲染函数
   */
  function render() {
    const canvas = canvasRef;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = ballState();
    const hex = hexagon();
    if (!state || !hex) return;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制动态背景渐变
    const time = Date.now() * 0.001;
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    gradient.addColorStop(0, `hsl(${220 + Math.sin(time * 0.5) * 10}, 40%, ${12 + Math.sin(time * 0.3) * 3}%)`);
    gradient.addColorStop(0.6, `hsl(${240 + Math.cos(time * 0.3) * 15}, 50%, ${8 + Math.cos(time * 0.2) * 2}%)`);
    gradient.addColorStop(1, '#0f0f1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制背景粒子效果
    drawBackgroundStars(ctx);

    // 绘制轨迹
    if (showTrails() && trails().length > 1) {
      drawTrails(ctx);
    }

    // 绘制六边形
    drawHexagon(ctx, hex);

    // 绘制小球
    drawBall(ctx, state.position);

    // 绘制粒子效果
    drawParticles(ctx);

    // 绘制碰撞效果
    drawCollisionEffects(ctx);

    // 绘制速度向量（调试用）
    if (import.meta.env.DEV) {
      drawVelocityVector(ctx, state.position, state.velocity);
    }
  }

  /**
   * 绘制背景星星效果
   */
  function drawBackgroundStars(ctx: CanvasRenderingContext2D) {
    const time = Date.now() * 0.001;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    
    for (let i = 0; i < 20; i++) {
      const x = (i * 137.5) % width;
      const y = (i * 117.3) % height;
      const size = 1 + Math.sin(time + i) * 0.5;
      
      ctx.globalAlpha = 0.3 + Math.sin(time * 2 + i) * 0.2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /**
   * 绘制粒子效果
   */
  function drawParticles(ctx: CanvasRenderingContext2D) {
    particles().forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /**
   * 绘制碰撞效果
   */
  function drawCollisionEffects(ctx: CanvasRenderingContext2D) {
    const currentTime = Date.now();
    
    collisionPoints().forEach(cp => {
      const age = (currentTime - cp.time) / 1000;
      const alpha = Math.max(0, 1 - age);
      const radius = cp.intensity * 30 * (1 + age * 2);
      
      ctx.globalAlpha = alpha * 0.3;
      ctx.strokeStyle = `hsl(${180 + cp.intensity * 60}, 80%, 70%)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cp.position.x, cp.position.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
  function drawTrails(ctx: CanvasRenderingContext2D) {
    const trailPoints = trails();
    if (trailPoints.length < 2) return;

    // 创建渐变轨迹效果
    for (let i = 1; i < trailPoints.length; i++) {
      const alpha = i / trailPoints.length;
      const point = trailPoints[i];
      const prevPoint = trailPoints[i - 1];
      
      const gradient = ctx.createLinearGradient(
        prevPoint.x, prevPoint.y, point.x, point.y
      );
      gradient.addColorStop(0, `hsla(${200 + i * 2}, 80%, 70%, ${alpha * 0.3})`);
      gradient.addColorStop(1, `hsla(${220 + i * 2}, 80%, 80%, ${alpha * 0.6})`);

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3 * alpha;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * 绘制六边形
   */
  function drawHexagon(ctx: CanvasRenderingContext2D, hex: Hexagon) {
    const vertices = hex.vertices;
    const time = Date.now() * 0.001;
    
    // 绘制六边形填充（动态透明度）
    const fillAlpha = 0.05 + Math.sin(time) * 0.03;
    ctx.fillStyle = `rgba(74, 144, 226, ${fillAlpha})`;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // 绘制六边形边框（动态发光效果）
    const glowIntensity = 15 + Math.sin(time * 2) * 5;
    ctx.strokeStyle = `hsl(210, 80%, ${60 + Math.sin(time) * 10}%)`;
    ctx.lineWidth = 4;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = glowIntensity;
    ctx.stroke();
    
    // 添加内发光
    ctx.shadowBlur = glowIntensity * 0.5;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 绘制顶点（动态大小和颜色）
    vertices.forEach((vertex, index) => {
      const vertexTime = time + index * 0.5;
      const size = 4 + Math.sin(vertexTime * 3) * 1.5;
      const hue = 200 + Math.sin(vertexTime) * 30;
      
      ctx.fillStyle = `hsl(${hue}, 80%, 70%)`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  /**
   * 绘制小球
   */
  function drawBall(ctx: CanvasRenderingContext2D, position: Vector2D) {
    const radius = physicsConfig().ballRadius;
    const velocity = physicsEngine()?.getVelocity() || 0;
    const time = Date.now() * 0.001;

    // 动态球体阴影
    const shadowOffset = 3 + Math.sin(time * 4) * 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(position.x + shadowOffset, position.y + shadowOffset, radius * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // 速度相关的发光效果
    const speedGlow = Math.min(velocity / 200, 1) * 10;
    if (speedGlow > 1) {
      ctx.shadowColor = '#ff6b6b';
      ctx.shadowBlur = speedGlow;
      ctx.fillStyle = `rgba(255, 107, 107, ${speedGlow * 0.1})`;
      ctx.beginPath();
      ctx.arc(position.x, position.y, radius + speedGlow, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 小球主体渐变（动态颜色）
    const hue = (time * 50 + velocity * 0.5) % 360;
    const ballGradient = ctx.createRadialGradient(
      position.x - radius/3, position.y - radius/3, 0,
      position.x, position.y, radius
    );
    ballGradient.addColorStop(0, `hsl(${hue}, 80%, 70%)`);
    ballGradient.addColorStop(0.6, `hsl(${hue + 20}, 75%, 60%)`);
    ballGradient.addColorStop(1, `hsl(${hue + 40}, 70%, 45%)`);

    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 多层高光效果
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + Math.sin(time * 3) * 0.2})`;
    ctx.beginPath();
    ctx.arc(position.x - radius/3, position.y - radius/3, radius/3, 0, Math.PI * 2);
    ctx.fill();

    // 次要高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(position.x + radius/4, position.y - radius/4, radius/6, 0, Math.PI * 2);
    ctx.fill();

    // 动态边框
    ctx.strokeStyle = `hsl(${hue + 180}, 60%, 80%)`;
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /**
   * 绘制速度向量（调试用）
   */
  function drawVelocityVector(ctx: CanvasRenderingContext2D, position: Vector2D, velocity: Vector2D) {
    const scale = 0.1;
    const endX = position.x + velocity.x * scale;
    const endY = position.y + velocity.y * scale;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 箭头
    const angle = Math.atan2(velocity.y, velocity.x);
    const arrowLength = 10;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle - Math.PI / 6),
      endY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle + Math.PI / 6),
      endY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }

  /**
   * 创建粒子效果
   */
  function createParticles(position: Vector2D, velocity: Vector2D, count: number = 8) {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100;
      const life = 0.5 + Math.random() * 0.5;
      
      newParticles.push({
        position: position.clone(),
        velocity: new Vector2D(Math.cos(angle) * speed, Math.sin(angle) * speed),
        life,
        maxLife: life,
        size: 2 + Math.random() * 3,
        color: `hsl(${Math.random() * 60 + 200}, 80%, 70%)`
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  }

  /**
   * 更新粒子系统
   */
  function updateParticles(deltaTime: number) {
    setParticles(prev => 
      prev.map(particle => ({
        ...particle,
        position: particle.position.add(particle.velocity.multiply(deltaTime)),
        velocity: particle.velocity.multiply(0.98), // 阻力
        life: particle.life - deltaTime
      })).filter(particle => particle.life > 0)
    );
  }

  /**
   * 添加碰撞效果
   */
  function addCollisionEffect(position: Vector2D, intensity: number) {
    setCollisionPoints(prev => [...prev, { position: position.clone(), intensity, time: Date.now() }]);
    createParticles(position, new Vector2D(0, 0), Math.floor(intensity * 12));
    
    // 清理旧的碰撞点
    setTimeout(() => {
      setCollisionPoints(prev => prev.filter(cp => Date.now() - cp.time < 1000));
    }, 1000);
  }
  function togglePlayPause() {
    setIsPlaying(!isPlaying());
  }

  function resetBall() {
    physicsEngine()?.reset();
    setTrails([]);
  }

  function updateConfig(updates: Partial<PhysicsConfig>) {
    setPhysicsConfig(prev => ({ ...prev, ...updates }));
  }

  return (
    <div class="bouncing-ball-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        class="game-canvas"
      />
      
      {/* 控制面板 */}
      <div class="controls-panel">
        <div class="control-group">
          <button onClick={togglePlayPause} class="control-button">
            {isPlaying() ? '⏸️ 暂停' : '▶️ 继续'}
          </button>
          <button onClick={resetBall} class="control-button">
            🔄 重置
          </button>
          <button 
            onClick={() => setShowTrails(!showTrails())}
            class={`control-button ${showTrails() ? 'active' : ''}`}
          >
            ✨ 轨迹
          </button>
        </div>
        
        <div class="stats">
          <div>
            <span>🚀 速度</span>
            <span>{velocity().toFixed(1)}</span>
          </div>
          <div>
            <span>⚡ 动能</span>
            <span>{kineticEnergy().toFixed(1)}</span>
          </div>
        </div>
        
        <div class="sliders">
          <div class="slider-group">
            <label>🌍 重力: {physicsConfig().gravity}</label>
            <input
              type="range"
              min="0"
              max="1000"
              value={physicsConfig().gravity}
              onInput={(e) => updateConfig({ gravity: Number(e.currentTarget.value) })}
            />
          </div>
          
          <div class="slider-group">
            <label>💨 摩擦: {physicsConfig().friction.toFixed(3)}</label>
            <input
              type="range"
              min="0"
              max="0.1"
              step="0.001"
              value={physicsConfig().friction}
              onInput={(e) => updateConfig({ friction: Number(e.currentTarget.value) })}
            />
          </div>
          
          <div class="slider-group">
            <label>🏀 弹性: {physicsConfig().restitution.toFixed(2)}</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={physicsConfig().restitution}
              onInput={(e) => updateConfig({ restitution: Number(e.currentTarget.value) })}
            />
          </div>
          
          <div class="slider-group">
            <label>🔄 旋转: {physicsConfig().rotationSpeed.toFixed(1)}</label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={physicsConfig().rotationSpeed}
              onInput={(e) => updateConfig({ rotationSpeed: Number(e.currentTarget.value) })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}