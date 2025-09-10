/**
 * 六边形几何计算工具
 */
import { Vector2D } from '../physics/Vector2D';

export interface HexagonEdge {
  start: Vector2D;
  end: Vector2D;
  normal: Vector2D;
}

export interface Hexagon {
  center: Vector2D;
  radius: number;
  vertices: Vector2D[];
  edges: HexagonEdge[];
  rotation: number;
}

/**
 * 创建六边形
 */
export function createHexagon(center: Vector2D, radius: number, rotation: number = 0): Hexagon {
  const vertices: Vector2D[] = [];
  const edges: HexagonEdge[] = [];

  // 计算6个顶点
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + rotation; // 60度间隔
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    vertices.push(new Vector2D(x, y));
  }

  // 计算6条边和法向量
  for (let i = 0; i < 6; i++) {
    const start = vertices[i];
    const end = vertices[(i + 1) % 6];
    
    // 计算边的法向量（指向六边形内部）
    const edgeVector = end.subtract(start);
    const normal = new Vector2D(-edgeVector.y, edgeVector.x).normalize();
    
    edges.push({ start, end, normal });
  }

  return {
    center,
    radius,
    vertices,
    edges,
    rotation
  };
}

/**
 * 旋转六边形
 */
export function rotateHexagon(hexagon: Hexagon, deltaRotation: number): Hexagon {
  return createHexagon(hexagon.center, hexagon.radius, hexagon.rotation + deltaRotation);
}

/**
 * 检测点是否在六边形内部
 */
export function isPointInsideHexagon(point: Vector2D, hexagon: Hexagon): boolean {
  // 使用射线投射算法
  let intersections = 0;
  
  for (const edge of hexagon.edges) {
    if (rayIntersectsEdge(point, edge.start, edge.end)) {
      intersections++;
    }
  }
  
  return intersections % 2 === 1;
}

/**
 * 射线与线段相交检测
 */
function rayIntersectsEdge(point: Vector2D, edgeStart: Vector2D, edgeEnd: Vector2D): boolean {
  // 从点向右发射水平射线
  if ((edgeStart.y > point.y) === (edgeEnd.y > point.y)) {
    return false; // 线段在点的同一侧
  }
  
  const intersectionX = edgeStart.x + (point.y - edgeStart.y) * (edgeEnd.x - edgeStart.x) / (edgeEnd.y - edgeStart.y);
  return intersectionX > point.x;
}

/**
 * 计算点到线段的最近点和距离
 */
export function distanceToEdge(point: Vector2D, edgeStart: Vector2D, edgeEnd: Vector2D): {
  distance: number;
  closestPoint: Vector2D;
  isOnSegment: boolean;
} {
  const edgeVector = edgeEnd.subtract(edgeStart);
  const pointVector = point.subtract(edgeStart);
  
  const edgeLengthSquared = edgeVector.magnitudeSquared();
  
  if (edgeLengthSquared === 0) {
    // 线段退化为点
    const distance = point.distance(edgeStart);
    return {
      distance,
      closestPoint: edgeStart,
      isOnSegment: true
    };
  }
  
  // 计算投影参数
  const t = Math.max(0, Math.min(1, pointVector.dot(edgeVector) / edgeLengthSquared));
  
  // 计算最近点
  const closestPoint = edgeStart.add(edgeVector.multiply(t));
  const distance = point.distance(closestPoint);
  
  return {
    distance,
    closestPoint,
    isOnSegment: t >= 0 && t <= 1
  };
}

/**
 * 检测圆与六边形边的碰撞
 */
export function circleHexagonCollision(
  circleCenter: Vector2D, 
  radius: number, 
  hexagon: Hexagon
): {
  isColliding: boolean;
  collisionEdge?: HexagonEdge;
  collisionPoint?: Vector2D;
  penetrationDepth?: number;
} {
  let closestEdge: HexagonEdge | null = null;
  let closestDistance = Infinity;
  let closestPoint: Vector2D | null = null;
  
  for (const edge of hexagon.edges) {
    const result = distanceToEdge(circleCenter, edge.start, edge.end);
    
    if (result.distance < closestDistance) {
      closestDistance = result.distance;
      closestEdge = edge;
      closestPoint = result.closestPoint;
    }
  }
  
  if (closestEdge && closestPoint && closestDistance <= radius) {
    return {
      isColliding: true,
      collisionEdge: closestEdge,
      collisionPoint: closestPoint,
      penetrationDepth: radius - closestDistance
    };
  }
  
  return { isColliding: false };
}

/**
 * 获取六边形的边界框
 */
export function getHexagonBounds(hexagon: Hexagon): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const vertex of hexagon.vertices) {
    minX = Math.min(minX, vertex.x);
    maxX = Math.max(maxX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxY = Math.max(maxY, vertex.y);
  }
  
  return { minX, maxX, minY, maxY };
}