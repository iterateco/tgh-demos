import Phaser from 'phaser';

export interface WedgeData {
  color: number;
  level: number; // 0 to 3
}

export interface ResonanceMeterProps {
  attunementLife: number; // 0 to 1
  wedges: WedgeData[];
}

export class ResonanceMeter extends Phaser.GameObjects.Container {
  private props: ResonanceMeterProps;

  private readonly centerHoleRadius = 20;
  private readonly segmentCount = 3;
  private readonly outerRadius = 100;
  private readonly segmentGap = 2;
  private readonly wedgeGapAngle = Phaser.Math.DegToRad(2);

  private segmentSprites: Phaser.GameObjects.Sprite[][] = [];
  private wedgeRTKey: string = 'resonance-wedge-white';

  constructor(scene: Phaser.Scene, x: number, y: number, props: ResonanceMeterProps) {
    super(scene, x, y);
    this.scene = scene;
    this.props = props;

    this.createWhiteWedgeTexture();
    this.createSprites();

    scene.add.existing(this);
  }

  private createWhiteWedgeTexture() {
    const wedgeCount = this.props.wedges.length || 1;
    const segmentThickness = (this.outerRadius - this.centerHoleRadius) / this.segmentCount;
    const wedgeAngle = (Math.PI * 2 - this.wedgeGapAngle * wedgeCount) / wedgeCount;

    // Increase render texture resolution for smoother edges
    const rtScale = 2;
    const rtSize = (this.outerRadius * 2 + 20) * rtScale;

    // Remove previous textures/frames
    for (let w = 0; w < wedgeCount; w++) {
      for (let level = 0; level < this.segmentCount; level++) {
        const frameKey = `${this.wedgeRTKey}-w${w}-seg${level}`;
        if (this.scene.textures.exists(frameKey)) {
          this.scene.textures.remove(frameKey);
        }
      }
    }

    // Render each wedge/segment as a separate frame
    for (let w = 0; w < wedgeCount; w++) {
      const segmentThickness = (this.outerRadius - this.centerHoleRadius) / this.segmentCount;
      const wedgeAngle = (Math.PI * 2 - this.wedgeGapAngle * wedgeCount) / wedgeCount;
      const startAngle = w * (wedgeAngle + this.wedgeGapAngle);

      for (let level = 0; level < this.segmentCount; level++) {
        const gfx = this.scene.add.graphics();
        gfx.x = rtSize / 2;
        gfx.y = rtSize / 2;
        gfx.clear();
        gfx.fillStyle(0xffffff, 1);

        // Scale radii for high-res drawing
        const innerRadius = (this.centerHoleRadius + segmentThickness * level + this.segmentGap / 2) * rtScale;
        const outerRadius = (this.centerHoleRadius + segmentThickness * (level + 1) - this.segmentGap / 2) * rtScale;
        this.drawDonutSliceOnGraphics(
          gfx,
          innerRadius,
          outerRadius,
          startAngle - wedgeAngle / 2,
          startAngle + wedgeAngle / 2
        );

        const rt = this.scene.add.renderTexture(0, 0, rtSize, rtSize);
        rt.draw(gfx, 0, 0);
        rt.render();
        gfx.destroy();

        const frameKey = `${this.wedgeRTKey}-w${w}-seg${level}`;
        rt.saveTexture(frameKey);
        rt.destroy();
      }
    }
  }

  private createSprites() {
    this.segmentSprites.flat().forEach(sprite => sprite.destroy());
    this.segmentSprites = [];

    const { wedges } = this.props;
    const wedgeCount = wedges.length;
    const segmentThickness = (this.outerRadius - this.centerHoleRadius) / this.segmentCount;
    const fullAngle = Math.PI * 2;
    const totalGapAngle = this.wedgeGapAngle * wedgeCount;
    const usableAngle = fullAngle - totalGapAngle;
    const wedgeAngle = usableAngle / wedgeCount;

    const rtScale = 2;
    const rtSize = (this.outerRadius * 2 + 20) * rtScale;
    const displaySize = this.outerRadius * 2 + 20;

    for (let w = 0; w < wedgeCount; w++) {
      const wedge = wedges[w];
      const wedgeSprites: Phaser.GameObjects.Sprite[] = [];

      for (let level = 0; level < this.segmentCount; level++) {
        const frameKey = `${this.wedgeRTKey}-w${w}-seg${level}`;

        const isActive = level < wedge.level;
        const baseColor = Phaser.Display.Color.IntegerToColor(wedge.color);
        const tint = isActive
          ? wedge.color
          : Phaser.Display.Color.GetColor(
            Math.round(baseColor.red * 0.3),
            Math.round(baseColor.green * 0.3),
            Math.round(baseColor.blue * 0.3)
          );

        const sprite = this.scene.add.sprite(0, 0, frameKey);
        sprite.setOrigin(0.5, 0.5);
        sprite.setTint(tint);

        // Scale down the high-res texture to normal display size
        sprite.setScale(displaySize / rtSize);

        // No rotation needed, as the wedge is already drawn at the correct angle
        sprite.x = 0;
        sprite.y = 0;

        this.add(sprite);
        wedgeSprites.push(sprite);
      }
      this.segmentSprites.push(wedgeSprites);
    }

    // Debug: Draw a circle at the container origin
    const debugGfx = this.scene.add.graphics();
    debugGfx.lineStyle(2, 0x00ff00, 1);
    debugGfx.strokeCircle(0, 0, 10);
    this.add(debugGfx);
  }

  public updateData(newData: ResonanceMeterProps): void {
    this.props = newData;
    this.createWhiteWedgeTexture();
    this.createSprites();
    // Optionally update attunement meter (not shown here)
  }

  /**
   * Draws a donut-shaped pie slice (ring segment) on a Phaser.Graphics object.
   * The gap between wedges is a constant angle, so the separation is a 3px arc at both the inner and outer radius.
   */
  private drawDonutSliceOnGraphics(
    gfx: Phaser.GameObjects.Graphics,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ): void {
    const steps = 40;
    const gapPx = 3;

    // Use the *inner* radius to compute the angular gap, so the gap is at least 3px at the center
    const gapAngle = gapPx / innerRadius;

    // Cut a gap of gapAngle from both sides
    const arcStart = startAngle + gapAngle / 2;
    const arcEnd = endAngle - gapAngle / 2;

    gfx.beginPath();

    // Outer arc (from arcStart to arcEnd)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = arcStart + t * (arcEnd - arcStart);
      const x = Math.cos(angle) * outerRadius;
      const y = Math.sin(angle) * outerRadius;
      if (i === 0) gfx.moveTo(x, y);
      else gfx.lineTo(x, y);
    }

    // Inner arc (from arcEnd to arcStart, reversed)
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const angle = arcStart + t * (arcEnd - arcStart);
      const x = Math.cos(angle) * innerRadius;
      const y = Math.sin(angle) * innerRadius;
      gfx.lineTo(x, y);
    }

    gfx.closePath();
    gfx.fillPath();
  }
}
