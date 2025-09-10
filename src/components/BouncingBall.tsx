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

    // 绘制背景渐变
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制轨迹
    if (showTrails() && trails().length > 1) {
      drawTrails(ctx);
    }

    // 绘制六边形
    drawHexagon(ctx, hex);

    // 绘制小球
    drawBall(ctx, state.position);

    // 绘制速度向量（调试用）
    if (import.meta.env.DEV) {
      drawVelocityVector(ctx, state.position, state.velocity);
    }
  }

  /**
   * 绘制轨迹
   */
  function drawTrails(ctx: CanvasRenderingContext2D) {
    const trailPoints = trails();
    if (trailPoints.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 彩虹渐变色轨迹
    const colors = [
      '#ff6b6b', '#ffa500', '#ffff00', '#90ee90', 
      '#00bfff', '#9370db', '#ff69b4'
    ];
    
    for (let i = 1; i < trailPoints.length; i++) {
      const alpha = i / trailPoints.length;
      const point = trailPoints[i];
      const prevPoint = trailPoints[i - 1];
      const colorIndex = Math.floor((i / trailPoints.length) * colors.length);
      const color = colors[colorIndex] || colors[colors.length - 1];
      
      // 创建渐变色线段
      const segmentGradient = ctx.createLinearGradient(
        prevPoint.x, prevPoint.y,
        point.x, point.y
      );
      segmentGradient.addColorStop(0, `${color}${Math.floor(alpha * 0.3 * 255).toString(16).padStart(2, '0')}`);
      segmentGradient.addColorStop(1, `${color}${Math.floor(alpha * 0.6 * 255).toString(16).padStart(2, '0')}`);
      
      ctx.strokeStyle = segmentGradient;
      ctx.lineWidth = 3 * alpha + 1; // 粗细渐变
      ctx.globalAlpha = alpha * 0.8;
      
      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      
      // 添加发光效果
      ctx.shadowColor = color;
      ctx.shadowBlur = 5 * alpha;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // 添加粒子效果
    for (let i = 0; i < trailPoints.length; i += 5) {
      const point = trailPoints[i];
      const alpha = i / trailPoints.length;
      const size = 2 * alpha + 1;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // 粒子发光
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 3;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
  }

  /**
   * 绘制六边形
   */
  function drawHexagon(ctx: CanvasRenderingContext2D, hex: Hexagon) {
    const vertices = hex.vertices;
    const center = hex.center;
    const time = performance.now() * 0.001; // 获取时间用于动画
    
    // 动态背景填充
    const fillGradient = ctx.createRadialGradient(
      center.x, center.y, 0,
      center.x, center.y, hex.radius
    );
    const alpha = 0.1 + Math.sin(time * 2) * 0.05; // 动态透明度
    fillGradient.addColorStop(0, `rgba(74, 144, 226, ${alpha * 0.5})`);
    fillGradient.addColorStop(0.7, `rgba(50, 100, 150, ${alpha})`);
    fillGradient.addColorStop(1, `rgba(30, 60, 90, ${alpha * 0.3})`);
    
    ctx.fillStyle = fillGradient;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // 绘制六边形边框 - 带有脉冲效果
    const pulseIntensity = 0.8 + Math.sin(time * 3) * 0.2;
    ctx.strokeStyle = `rgba(74, 144, 226, ${pulseIntensity})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#4a90e2';
    ctx.shadowBlur = 15 + Math.sin(time * 4) * 5; // 动态阴影
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 绘制顶点 - 带有呼吸效果
    for (let i = 0; i < vertices.length; i++) {
      const vertex = vertices[i];
      const breathe = 1 + Math.sin(time * 2 + i * Math.PI / 3) * 0.3;
      const vertexAlpha = 0.8 + Math.sin(time * 3 + i * Math.PI / 4) * 0.2;
      
      // 顶点外发光
      const vertexGlow = ctx.createRadialGradient(
        vertex.x, vertex.y, 0,
        vertex.x, vertex.y, 8 * breathe
      );
      vertexGlow.addColorStop(0, `rgba(107, 182, 255, ${vertexAlpha})`);
      vertexGlow.addColorStop(1, 'rgba(107, 182, 255, 0)');
      
      ctx.fillStyle = vertexGlow;
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, 8 * breathe, 0, Math.PI * 2);
      ctx.fill();
      
      // 顶点核心
      ctx.fillStyle = '#6bb6ff';
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, 4 * breathe, 0, Math.PI * 2);
      ctx.fill();
      
      // 顶点高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(vertex.x - 1, vertex.y - 1, 1.5 * breathe, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 添加能量环效果
    const ringRadius = hex.radius + 10 + Math.sin(time * 2) * 5;
    const ringAlpha = 0.3 + Math.sin(time * 3) * 0.2;
    ctx.strokeStyle = `rgba(74, 144, 226, ${ringAlpha})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * 绘制小球
   */
  function drawBall(ctx: CanvasRenderingContext2D, position: Vector2D) {
    const radius = physicsConfig().ballRadius;

    // 小球阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(position.x + 3, position.y + 3, radius, 0, Math.PI * 2);
    ctx.fill();

    // 外层发光效果
    const glowGradient = ctx.createRadialGradient(
      position.x, position.y, radius * 0.8,
      position.x, position.y, radius * 2
    );
    glowGradient.addColorStop(0, 'rgba(255, 107, 107, 0.4)');
    glowGradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.2)');
    glowGradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // 小球主体渐变
    const ballGradient = ctx.createRadialGradient(
      position.x - radius/3, position.y - radius/3, 0,
      position.x, position.y, radius
    );
    ballGradient.addColorStop(0, '#ff6b6b');
    ballGradient.addColorStop(0.7, '#ee5a24');
    ballGradient.addColorStop(1, '#c44569');

    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 内层高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(position.x - radius/3, position.y - radius/3, radius/4, 0, Math.PI * 2);
    ctx.fill();

    // 次要高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(position.x + radius/4, position.y + radius/4, radius/6, 0, Math.PI * 2);
    ctx.fill();

    // 小球边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.stroke();
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
   * 控制函数
   */
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
            {isPlaying() ? '暂停' : '继续'}
          </button>
          <button onClick={resetBall} class="control-button">
            重置
          </button>
          <button 
            onClick={() => setShowTrails(!showTrails())}
            class={`control-button ${showTrails() ? 'active' : ''}`}
          >
            轨迹
          </button>
        </div>
        
        <div class="stats">
          <div>速度: {velocity().toFixed(1)}</div>
          <div>动能: {kineticEnergy().toFixed(1)}</div>
        </div>
        
        <div class="sliders">
          <div class="slider-group">
            <label>重力: {physicsConfig().gravity}</label>
            <input
              type="range"
              min="0"
              max="1000"
              value={physicsConfig().gravity}
              onInput={(e) => updateConfig({ gravity: Number(e.currentTarget.value) })}
            />
          </div>
          
          <div class="slider-group">
            <label>摩擦: {physicsConfig().friction.toFixed(3)}</label>
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
            <label>弹性: {physicsConfig().restitution.toFixed(2)}</label>
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
            <label>旋转: {physicsConfig().rotationSpeed.toFixed(1)}</label>
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