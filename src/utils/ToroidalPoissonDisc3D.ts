import { poissonDisc3D } from './poissonDisc3D';

interface Entity {
  r: number
}

export interface TPDPoint<TEntity extends Entity = Entity> {
  x: number
  y: number
  z: number
  entity: TEntity
}

export class ToroidalPoissonDisc3D<TEntity extends Entity> {
  worldWidth: number;
  worldHeight: number;
  worldDepth: number;
  cellSize: number;
  cellsX: number;
  cellsY: number;
  cellsZ: number;
  minPointDist = 10;
  generatedSet = new Set<string>();
  spatialHash = new Map<string, TPDPoint[]>();
  points: TPDPoint<TEntity>[] = [];

  constructor(worldWidth: number, worldHeight: number, worldDepth: number, cellSize = 50) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.worldDepth = worldDepth;
    this.cellSize = cellSize;
    this.cellsX = worldWidth / cellSize;
    this.cellsY = worldHeight / cellSize;
    this.cellsZ = worldDepth / cellSize;
  }

  generate(
    params: {
      width: number
      height: number
      cameraX: number
      cameraY: number
      cameraZ: number
      near?: number
      far?: number
      fov?: number
      getEntity: (seed: number) => TEntity
    }
  ) {
    const { width, height, cameraX, cameraY, cameraZ, near = 0, far = 1000, fov = 500 } = params;
    const margin = Math.round(width / 2);

    const startZ = Math.floor((cameraZ + near) / this.cellSize);
    const endZ = Math.floor((cameraZ + far + margin) / this.cellSize);

    for (let gz = startZ; gz <= endZ; gz++) {
      const z = gz * this.cellSize;
      const dz = z - cameraZ;
      const scale = fov / (dz + fov);

      const halfWidth = (width / 2) / scale;
      const halfHeight = (height / 2) / scale;

      const startX = Math.floor((cameraX - halfWidth - margin) / this.cellSize);
      const endX = Math.floor((cameraX + halfWidth + margin) / this.cellSize);
      const startY = Math.floor((cameraY - halfHeight - margin) / this.cellSize);
      const endY = Math.floor((cameraY + halfHeight + margin) / this.cellSize);

      for (let gx = startX; gx <= endX; gx++) {
        for (let gy = startY; gy <= endY; gy++) {
          this.generatePointsInCell(gx, gy, gz, params.getEntity);
        }
      }
    }

    return this.points;
  }

  private hashKey(x: number, y: number, z: number) {
    return `${(x + this.cellsX) % this.cellsX},${(y + this.cellsY) % this.cellsY},${(z + this.cellsZ) % this.cellsZ}`;
  }

  private hashPoint(p: TPDPoint) {
    const { r } = p.entity;
    const minX = Math.floor((p.x - r) / this.cellSize);
    const maxX = Math.floor((p.x + r) / this.cellSize);
    const minY = Math.floor((p.y - r) / this.cellSize);
    const maxY = Math.floor((p.y + r) / this.cellSize);
    const minZ = Math.floor((p.z - r) / this.cellSize);
    const maxZ = Math.floor((p.z + r) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const k = this.hashKey(x, y, z);
          if (!this.spatialHash.has(k)) this.spatialHash.set(k, []);
          this.spatialHash.get(k)!.push(p);
        }
      }
    }
  }

  private checkOverlap(x: number, y: number, z: number, r: number) {
    const minX = Math.floor((x - r) / this.cellSize);
    const maxX = Math.floor((x + r) / this.cellSize);
    const minY = Math.floor((y - r) / this.cellSize);
    const maxY = Math.floor((y + r) / this.cellSize);
    const minZ = Math.floor((z - r) / this.cellSize);
    const maxZ = Math.floor((z + r) / this.cellSize);

    for (let gx = minX; gx <= maxX; gx++) {
      for (let gy = minY; gy <= maxY; gy++) {
        for (let gz = minZ; gz <= maxZ; gz++) {
          const k = this.hashKey(gx, gy, gz);
          const bucket = this.spatialHash.get(k);
          if (!bucket) continue;
          for (const c of bucket) {
            let dx = Math.abs(x - c.x);
            let dy = Math.abs(y - c.y);
            let dz = Math.abs(z - c.z);
            dx = Math.min(dx, this.worldWidth - dx);
            dy = Math.min(dy, this.worldHeight - dy);
            dz = Math.min(dz, this.worldDepth - dz);
            if (Math.sqrt(dx * dx + dy * dy + dz * dz) < r + c.entity.r) return true;
          }
        }
      }
    }
    return false;
  }

  private generatePointsInCell(ix: number, iy: number, iz: number, getEntity: (seed: number) => TEntity) {
    const k = this.hashKey(ix, iy, iz);

    if (this.generatedSet.has(k)) {
      return;
    }

    this.generatedSet.add(k);

    const baseX = ((ix % this.cellsX + this.cellsX) % this.cellsX) * this.cellSize;
    const baseY = ((iy % this.cellsY + this.cellsY) % this.cellsY) * this.cellSize;
    const baseZ = ((iz % this.cellsZ + this.cellsZ) % this.cellsZ) * this.cellSize;

    const points = poissonDisc3D(this.cellSize, this.cellSize, this.cellSize, this.minPointDist);

    // Deterministic entity index based on cell coordinates
    const cellSeed = ((ix * 73856093) ^ (iy * 19349663) ^ (iz * 47593658)) >>> 0;
    let entityIdx = 0;

    for (const d of points) {
      const x = (baseX + d.x) % this.worldWidth;
      const y = (baseY + d.y) % this.worldHeight;
      const z = (baseZ + d.z) % this.worldDepth;
      const entity = getEntity(cellSeed + entityIdx);

      if (!this.checkOverlap(x, y, z, entity.r)) {
        const p = { x, y, z, entity };
        this.points.push(p);
        this.hashPoint(p);
        entityIdx++;
      }
    }
  }
}
