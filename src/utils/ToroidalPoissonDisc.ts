import { poissonDisc } from './poissonDisc';

interface Entity {
  r: number
}

interface Circle<TEntity extends Entity = Entity> {
  x: number
  y: number
  entity: TEntity
}

export class ToroidalPoissonDisc<TEntity extends Entity> {
  worldWidth: number;
  worldHeight: number;
  cellSize: number;
  cellsX: number;
  cellsY: number;
  minPointDist = 10;
  generatedSet = new Set<string>();
  spatialHash = new Map<string, Circle[]>();
  circles: Circle<TEntity>[] = [];
  entities: TEntity[] = [];

  constructor(worldWidth: number, worldHeight: number, cellSize = 50) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.cellSize = cellSize;
    this.cellsX = worldWidth / cellSize;
    this.cellsY = worldHeight / cellSize;
  }

  generate(width: number, height: number, cameraX: number, cameraY: number) {
    const margin = 150;
    const startX = Math.floor((cameraX - margin) / this.cellSize);
    const endX = Math.floor((cameraX + width + margin) / this.cellSize);
    const startY = Math.floor((cameraY - margin) / this.cellSize);
    const endY = Math.floor((cameraY + height + margin) / this.cellSize);

    for (let gx = startX; gx <= endX; gx++) {
      for (let gy = startY; gy <= endY; gy++) {
        this.generatePointsInCell(gx, gy);
      }
    }

    return this.circles;
  }

  private hashKey(x: number, y: number) {
    return `${(x + this.cellsX) % this.cellsX},${(y + this.cellsY) % this.cellsY}`;
  }

  private hashCircle(c: Circle) {
    const minX = Math.floor((c.x - c.entity.r) / this.cellSize);
    const maxX = Math.floor((c.x + c.entity.r) / this.cellSize);
    const minY = Math.floor((c.y - c.entity.r) / this.cellSize);
    const maxY = Math.floor((c.y + c.entity.r) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const k = this.hashKey(x, y);
        if (!this.spatialHash.has(k)) this.spatialHash.set(k, []);
        this.spatialHash.get(k)!.push(c);
      }
    }
  }

  private checkOverlap(x: number, y: number, r: number) {
    const minX = Math.floor((x - r) / this.cellSize);
    const maxX = Math.floor((x + r) / this.cellSize);
    const minY = Math.floor((y - r) / this.cellSize);
    const maxY = Math.floor((y + r) / this.cellSize);

    for (let gx = minX; gx <= maxX; gx++) {
      for (let gy = minY; gy <= maxY; gy++) {
        const k = this.hashKey(gx, gy);
        const bucket = this.spatialHash.get(k);
        if (!bucket) continue;
        for (const c of bucket) {
          let dx = Math.abs(x - c.x);
          let dy = Math.abs(y - c.y);
          dx = Math.min(dx, this.worldWidth - dx);
          dy = Math.min(dy, this.worldHeight - dy);
          if (Math.sqrt(dx * dx + dy * dy) < r + c.entity.r) return true;
        }
      }
    }
    return false;
  }

  private generatePointsInCell(ix: number, iy: number) {
    const k = this.hashKey(ix, iy);

    if (this.generatedSet.has(k)) {
      return;
    }
    this.generatedSet.add(k);

    const baseX = ((ix % this.cellsX + this.cellsX) % this.cellsX) * this.cellSize;
    const baseY = ((iy % this.cellsY + this.cellsY) % this.cellsY) * this.cellSize;

    const points = poissonDisc(this.cellSize, this.cellSize, this.minPointDist);

    // Deterministic entity index based on cell coordinates
    const cellSeed = ((ix * 73856093) ^ (iy * 19349663)) >>> 0;
    let entityIdx = cellSeed % this.entities.length;

    for (const d of points) {
      const x = (baseX + d.x) % this.worldWidth;
      const y = (baseY + d.y) % this.worldHeight;
      const entity = this.entities[entityIdx];

      if (!this.checkOverlap(x, y, entity.r)) {
        const c = { x, y, entity };
        this.circles.push(c);
        this.hashCircle(c);
        entityIdx = (entityIdx + 1) % this.entities.length;
      }
    }
  }
}
